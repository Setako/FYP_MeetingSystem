import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType, InstanceType } from 'typegoose';
import uuidv4 from 'uuid/v4';
import { User } from '../user/user.model';
import { UserService } from '../user/user.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { EditMeetingDto } from './dto/edit-meeting.dto';
import {
    MeetingQueryDto,
    MeetingSortBy,
    MeetingOrderBy,
} from './dto/meeting-query.dto';
import { InvitationsDto } from './dto/invitations.dto';
import {
    Invitation,
    InvitationStatus,
    Meeting,
    MeetingStatus,
    AttendanceStatus,
    Resources,
    ResourcesSharing,
} from './meeting.model';
import {
    from,
    merge,
    of,
    empty,
    defer,
    Observable,
    concat,
    identity,
    fromEvent,
} from 'rxjs';
import { map, flatMap, filter, toArray } from 'rxjs/operators';
import { FriendService } from '../friend/friend.service';
import { GoogleDriveService } from '../google/google-drive.service';

@Injectable()
export class MeetingService {
    constructor(
        @InjectModel(Meeting) private readonly meetingModel: ModelType<Meeting>,
        private readonly userService: UserService,
        private readonly friendService: FriendService,
        private readonly googleDriveService: GoogleDriveService,
    ) {}

    watchModelSave(): Observable<InstanceType<Meeting>> {
        return fromEvent(this.meetingModel, 'save');
    }

    getById(id: string) {
        return of(id).pipe(
            flatMap(meetingId => this.meetingModel.findById(meetingId).exec()),
        );
    }

    getByIds(ids: string[]) {
        return of({ _id: { $in: ids } }).pipe(
            flatMap(conditions => this.meetingModel.find(conditions).exec()),
            flatMap(identity),
        );
    }

    getByIdsWithPage(ids: string[], pageSize: number, pageNum = 1) {
        return of({ _id: { $in: ids } }).pipe(
            flatMap(conditions =>
                this.meetingModel
                    .find(conditions)
                    .skip(pageSize * (pageNum - 1))
                    .limit(pageSize)
                    .exec(),
            ),
            flatMap(identity),
        );
    }

    turnAllStartedMeetingsToEnded(realEndTime = new Date()) {
        return from(
            this.meetingModel
                .updateMany(
                    {
                        status: MeetingStatus.Started,
                    },
                    {
                        status: MeetingStatus.Ended,
                        realEndTime,
                    },
                )
                .exec(),
        );
    }

    async getQueryOption(
        query: MeetingQueryDto,
        ownerId: string,
    ): Promise<object> {
        let options = {} as any;

        if (query.status) {
            options.status = {
                $in: query.status,
            };
        }

        const hostedByAnyone = ['true', undefined].some(
            item => item === query.hostedByMe && item === query.hostedByOther,
        );
        const hostedByMe = query.hostedByMe === 'true';
        const hostedByOther = query.hostedByOther === 'true';
        const invitingMe = query.invitingMe === 'true';
        const invitingFromFriend = query.invitingFromFriend === 'true';

        if (invitingMe) {
            const ownerOptions = {
                owner: await (async () => {
                    if (query.invitingFromFriend === undefined) {
                        return {
                            $not: {
                                $eq: Types.ObjectId(ownerId),
                            },
                        };
                    }

                    const friends = await this.friendService
                        .getAllByUserId(ownerId)
                        .pipe(
                            flatMap(item =>
                                item.friends.filter(
                                    friend =>
                                        !(friend as Types.ObjectId).equals(
                                            ownerId,
                                        ),
                                ),
                            ),
                            toArray(),
                        )
                        .toPromise();

                    return invitingFromFriend
                        ? { $in: friends }
                        : { $nin: friends };
                })(),
            };

            options = {
                ...options,
                status: {
                    $in: [
                        MeetingStatus.Planned,
                        MeetingStatus.Confirmed,
                        MeetingStatus.Started,
                    ],
                },
                'invitations.user': { $eq: Types.ObjectId(ownerId) },
                'invitations.status': InvitationStatus.Waiting,
                ...ownerOptions,
            };
        } else if (hostedByAnyone) {
            options = {
                ...options,
                $or: [
                    {
                        owner: { $eq: Types.ObjectId(ownerId) },
                    },
                    {
                        'attendance.user': { $eq: Types.ObjectId(ownerId) },
                    },
                    {
                        $and: [
                            {
                                'invitations.user': {
                                    $eq: Types.ObjectId(ownerId),
                                },
                            },
                            {
                                'invitations.status': InvitationStatus.Accepted,
                            },
                        ],
                    },
                ],
            };
        } else if (hostedByOther) {
            options = {
                ...options,
                owner: {
                    $not: {
                        $eq: Types.ObjectId(ownerId),
                    },
                },
                $or: [
                    { 'attendance.user': { $eq: Types.ObjectId(ownerId) } },
                    {
                        'invitations.user': { $eq: Types.ObjectId(ownerId) },
                        'invitations.status': InvitationStatus.Accepted,
                    },
                ],
            };
        } else if (hostedByMe) {
            options = {
                ...options,
                owner: {
                    $eq: Types.ObjectId(ownerId),
                },
            };
        } else {
            options = {
                ...options,
                owner: {
                    $in: [],
                },
            };
        }

        return options;
    }

    sortMeetings(
        list: Observable<InstanceType<Meeting>>,
        sortBy: MeetingSortBy = MeetingSortBy.Date,
        orderBy: MeetingOrderBy = MeetingOrderBy.DESC,
    ) {
        const haveRealStartTime = list.pipe(
            filter(item => Boolean(item.realStartTime)),
            toArray(),
            flatMap(items =>
                items.sort((a, b) =>
                    orderBy === MeetingOrderBy.ASC
                        ? a.realStartTime.getTime() - b.realStartTime.getTime()
                        : b.realStartTime.getTime() - a.realStartTime.getTime(),
                ),
            ),
        );

        const havePlannedStartTime = list.pipe(
            filter(
                item =>
                    !Boolean(item.realStartTime) &&
                    Boolean(item.plannedStartTime),
            ),
            toArray(),
            flatMap(items =>
                items.sort((a, b) =>
                    orderBy === MeetingOrderBy.ASC
                        ? a.plannedStartTime.getTime() -
                          b.plannedStartTime.getTime()
                        : b.plannedStartTime.getTime() -
                          a.plannedStartTime.getTime(),
                ),
            ),
        );

        const haveCreateDate = list.pipe(
            filter(
                item =>
                    !Boolean(item.realStartTime) &&
                    !Boolean(item.plannedStartTime),
            ),
            toArray(),
            flatMap(items =>
                items.sort((a, b) =>
                    orderBy === MeetingOrderBy.ASC
                        ? (a._id as Types.ObjectId).getTimestamp().getTime() -
                          (b._id as Types.ObjectId).getTimestamp().getTime()
                        : (b._id as Types.ObjectId).getTimestamp().getTime() -
                          (a._id as Types.ObjectId).getTimestamp().getTime(),
                ),
            ),
        );

        if (sortBy === MeetingSortBy.Date) {
            const order = [
                haveCreateDate,
                havePlannedStartTime,
                haveRealStartTime,
            ];
            return orderBy === MeetingOrderBy.ASC
                ? concat(...order)
                : concat(...order.reverse());
        } else if (sortBy === MeetingSortBy.Owner) {
            return list.pipe(
                toArray(),
                map(items =>
                    items.sort((a, b) =>
                        a.title > b.title ? -1 : a.title < b.title ? 1 : 0,
                    ),
                ),
                flatMap(items =>
                    orderBy === MeetingOrderBy.ASC ? items : items.reverse(),
                ),
            );
        } else {
            return list.pipe(
                toArray(),
                map(items =>
                    items.sort((a, b) => {
                        const aOwner = (a.owner as InstanceType<User>)
                            .displayName;
                        const bOwner = (b.owner as InstanceType<User>)
                            .displayName;
                        return aOwner > bOwner ? -1 : aOwner < bOwner ? 1 : 0;
                    }),
                ),
                flatMap(items =>
                    orderBy === MeetingOrderBy.ASC ? items : items.reverse(),
                ),
            );
        }
    }

    countDocumentsByIds(ids: string[]) {
        return of({ _id: { $in: ids } }).pipe(
            flatMap(conditions =>
                this.meetingModel
                    .find(conditions)
                    .countDocuments()
                    .exec(),
            ),
        );
    }

    countDocuments(options = {}) {
        return of(options).pipe(
            flatMap(conditions =>
                this.meetingModel
                    .find(conditions)
                    .countDocuments()
                    .exec(),
            ),
        );
    }

    getAll(options = {}, sortOptions = {}) {
        return of(options).pipe(
            flatMap(conditions =>
                this.meetingModel
                    .find(conditions)
                    .sort(sortOptions)
                    .exec(),
            ),
            flatMap(identity),
        );
    }

    getAllWithPage(
        pageSize: number,
        pageNum = 1,
        options = {},
        sortOptions = {},
    ) {
        return of(options).pipe(
            flatMap(conditions =>
                this.meetingModel
                    .find(conditions)
                    .skip(pageSize * (pageNum - 1))
                    .limit(pageSize)
                    .sort(sortOptions)
                    .exec(),
            ),
            flatMap(identity),
        );
    }

    findAll(options = {}) {
        return this.meetingModel.find(options);
    }

    async create(createMeetingDto: CreateMeetingDto, owner: User) {
        const { language = 'en-US', priority = 1 } = createMeetingDto;

        const meeting = new this.meetingModel({
            ...createMeetingDto,
            language,
            priority,
            owner,
            status: MeetingStatus.Draft,
        });

        return meeting.save();
    }

    async edit(id: string, editMeetingDto: EditMeetingDto) {
        let edited = await this.meetingModel.findById(id).populate('owner');

        if (!edited) {
            return null;
        }

        if (Boolean(editMeetingDto.invitations)) {
            await edited.save();
            edited = await this.editInvitations(
                edited.id,
                editMeetingDto.invitations,
            );
        }

        [
            'type',
            'title',
            'description',
            'length',
            'location',
            'language',
            'priority',
            'generalPermission',
            'agendaGoogleResourceId',
        ].forEach(
            item => (edited[item] = editMeetingDto[item] || edited[item]),
        );

        edited.resources.main =
            editMeetingDto.mainResources ||
            (editMeetingDto.resources && editMeetingDto.resources.main) ||
            edited.resources.main;

        from(edited.resources.main.googleDriveResources)
            .pipe(
                flatMap(item =>
                    this.googleDriveService.setAnyoneWithLinkPermission(
                        (edited.owner as InstanceType<User>).googleRefreshToken,
                        item.resId,
                    ),
                ),
            )
            .subscribe();

        edited.plannedStartTime = editMeetingDto.plannedStartTime
            ? new Date(editMeetingDto.plannedStartTime)
            : edited.plannedStartTime;
        edited.realStartTime = editMeetingDto.realStartTime
            ? new Date(editMeetingDto.realStartTime)
            : edited.realStartTime;
        edited.realEndTime = editMeetingDto.realEndTime
            ? new Date(editMeetingDto.realEndTime)
            : edited.realEndTime;

        return edited.save();
    }

    async updateUserSharedResource(
        meetingId: string,
        userId: string,
        newResources: Resources,
    ) {
        const meeting = await this.getById(meetingId).toPromise();

        const userResourcesMap = new Map(
            meeting.resources.user.map(
                ({ sharer, resources }) =>
                    [(sharer as Types.ObjectId).toHexString(), resources] as [
                        string,
                        Resources
                    ],
            ),
        );

        if (newResources.googleDriveResources.length === 0) {
            userResourcesMap.delete(userId);
        } else {
            userResourcesMap.set(userId, newResources);

            const user = await this.userService.getById(userId).toPromise();
            from(newResources.googleDriveResources)
                .pipe(
                    flatMap(item =>
                        this.googleDriveService.setAnyoneWithLinkPermission(
                            user.googleRefreshToken,
                            item.resId,
                        ),
                    ),
                )
                .subscribe();
        }

        meeting.resources.user = [...userResourcesMap.entries()].map(
            ([sharer, resources]) => ({
                sharer: Types.ObjectId(sharer),
                resources,
            }),
        );

        meeting.resources.user = meeting.resources.user.filter(
            item => item.resources.googleDriveResources.length,
        );

        return meeting.save();
    }

    async getAccessableResources(meetingId: string, operatorId: string) {
        const meeting = await this.getById(meetingId).toPromise();
        const resources = meeting.resources;

        if (!(meeting.owner as Types.ObjectId).equals(operatorId)) {
            resources.main = this.filterNoPublicResourcesBySharingStatus(
                resources.main,
                meeting.status,
            );
        }

        const userResources = resources.user.filter(item => item);

        const operatorShared = userResources.filter(({ sharer }) =>
            Types.ObjectId(operatorId).equals(sharer as any),
        );

        const otherShared = userResources.filter(
            ({ sharer }) => !Types.ObjectId(operatorId).equals(sharer as any),
        );

        const otherAccessable = otherShared.map(item => {
            item.resources = this.filterNoPublicResourcesBySharingStatus(
                item.resources,
                meeting.status,
            );
            return item;
        });

        resources.user = operatorShared
            .concat(otherAccessable)
            .filter(item => item.resources.googleDriveResources.length);

        return resources;
    }

    filterNoPublicResourcesBySharingStatus(
        resources: Resources,
        status: MeetingStatus,
    ) {
        resources.googleDriveResources = resources.googleDriveResources.filter(
            ({ sharing }) => {
                switch (sharing) {
                    case ResourcesSharing.PreMeeting:
                        return true;
                    case ResourcesSharing.InMeeting:
                        return [
                            MeetingStatus.Started,
                            MeetingStatus.Ended,
                        ].includes(status);
                    case ResourcesSharing.PostMeeting:
                        return MeetingStatus.Ended === status;
                    default:
                        return false;
                }
            },
        );
        return resources;
    }

    async addAttendance(id: string, attendeeId: string) {
        const meeting$ = defer(() =>
            this.meetingModel.findById(id).exec(),
        ).pipe(flatMap(item => (item ? of(item) : empty())));

        const attendance$ = meeting$.pipe(map(item => item.attendance));

        const attendeeIds$ = attendance$.pipe(
            map(item =>
                item.map(attendee =>
                    (attendee.user as Types.ObjectId).toHexString(),
                ),
            ),
        );

        const ifNotExistAttendee$ = attendeeIds$.pipe(
            flatMap(list =>
                list.includes(attendeeId) ? empty() : of(attendeeId),
            ),
        );

        const saveAttendee$ = ifNotExistAttendee$.pipe(
            flatMap(attendee =>
                meeting$.pipe(
                    flatMap(item => {
                        item.attendance.push({
                            user: Types.ObjectId(attendee),
                        });
                        return item.save();
                    }),
                ),
            ),
        );

        return saveAttendee$.toPromise();
    }

    async isAttendeeExist(id: string, attendeeId: string) {
        return defer(() =>
            this.meetingModel
                .find({
                    _id: { $eq: Types.ObjectId(id) },
                    'attendance.user': { $eq: Types.ObjectId(attendeeId) },
                })
                .countDocuments()
                .exec(),
        )
            .pipe(map(Boolean))
            .toPromise();
    }

    async updateAttendeeStatus(
        id: string,
        attendeeId: string,
        status: AttendanceStatus,
    ) {
        const meeting$ = from(this.meetingModel.findById(id).exec()).pipe(
            flatMap(item => (item ? of(item) : empty())),
        );

        return meeting$
            .pipe(
                flatMap(item => {
                    const attendee = item.attendance.find(attendance =>
                        (attendance.user as Types.ObjectId).equals(attendeeId),
                    );

                    if (!attendee) {
                        return of(item);
                    }

                    attendee.status = status;
                    return item.save();
                }),
            )
            .toPromise();
    }

    async updateAttendeeArrivalTime(
        id: string,
        attendeeId: string,
        arrivalTime = new Date(),
    ) {
        const meeting$ = from(this.meetingModel.findById(id).exec()).pipe(
            flatMap(item => (item ? of(item) : empty())),
        );

        return meeting$
            .pipe(
                flatMap(item => {
                    const attendee = item.attendance.find(attendance =>
                        (attendance.user as Types.ObjectId).equals(attendeeId),
                    );

                    if (!attendee) {
                        return of(item);
                    }

                    attendee.status = arrivalTime
                        ? AttendanceStatus.Present
                        : AttendanceStatus.Absent;
                    attendee.arrivalTime = arrivalTime || undefined;
                    return item.save();
                }),
            )
            .toPromise();
    }

    async editStatus(id: string, status: MeetingStatus) {
        return from(this.meetingModel.findById(id).exec())
            .pipe(
                filter(item => Boolean(item)),
                flatMap(item => {
                    item.status = status;
                    return item.save();
                }),
            )
            .toPromise();
    }

    async treatAllWaitingInviationToReject(id: string) {
        return this.meetingModel
            .updateOne(
                {
                    _id: { $eq: Types.ObjectId(id) },
                },
                {
                    $set: {
                        'invitations.$[waiting].status':
                            InvitationStatus.Declined,
                    },
                },
                {
                    arrayFilters: [
                        { 'waiting.status': InvitationStatus.Waiting },
                    ],
                },
            )
            .exec();
    }

    async delete(id: string) {
        return from(this.meetingModel.findById(id).exec())
            .pipe(
                flatMap(item => (item ? of(item) : empty())),
                flatMap(item => item.remove()),
            )
            .toPromise();
    }

    async findNewInviteeIds(meetingId: string, invitations: InvitationsDto) {
        const invitationList = invitations || undefined;
        const emails = new Set(invitationList ? invitationList.emails : []);
        const friends = new Set(invitationList ? invitationList.friends : []);

        const meeting = await this.meetingModel
            .findById(meetingId)
            .populate('owner invitations.user')
            .exec();

        [meeting.owner as InstanceType<User>].map(owner => {
            emails.delete(owner.email);
            friends.delete(owner.username);
        });

        const friendIds$ = from(friends.values()).pipe(
            flatMap(item => this.userService.getByUsername(item)),
            filter(Boolean.bind(null)),
            map(({ id }) => id as string),
        );

        const emailOnwerId$ = from(emails.values()).pipe(
            flatMap(email => this.userService.getByEmail(email)),
            filter(Boolean.bind(null)),
            map(item => item.id as string),
        );

        return merge(friendIds$, emailOnwerId$)
            .pipe(toArray())
            .toPromise();
    }

    async editInvitations(meetingId: string, invitations: InvitationsDto) {
        const meeting = await this.meetingModel
            .findById(meetingId)
            .populate('owner invitations.user')
            .exec();

        if (!meeting) {
            return null;
        }
        const invitationList = invitations || undefined;
        const emails = new Set(invitationList ? invitationList.emails : []);
        const friends = new Set(invitationList ? invitationList.friends : []);

        [meeting.owner as InstanceType<User>].map(owner => {
            emails.delete(owner.email);
            friends.delete(owner.username);
        });

        const kept$ = from(meeting.invitations).pipe(
            filter(item => {
                const user: InstanceType<User> = item.user as any;
                const hasEmail = item.email && emails.delete(item.email);
                const hasEmail2 = user && emails.delete(user.email);
                const hasFriends = user && friends.delete(user.username);
                return hasEmail || hasEmail2 || hasFriends;
            }),
        );

        const friends$ = from(friends.values()).pipe(
            flatMap(item => this.userService.getByUsername(item)),
            filter(Boolean.bind(null)),
            map(({ _id }) => ({
                id: uuidv4(),
                user: _id as Types.ObjectId,
                status: InvitationStatus.Waiting,
            })),
        );

        const emails$ = from(emails.values()).pipe(
            flatMap(email =>
                this.userService
                    .getByEmail(email)
                    .pipe(map(user => (user ? { user, email } : { email }))),
            ),
            map(item => ({
                ...item,
                id: uuidv4(),
                status: InvitationStatus.Waiting,
            })),
        );

        meeting.invitations = (await merge(kept$, friends$, emails$)
            .pipe(toArray())
            .toPromise()) as Invitation[];

        return meeting.save();
    }

    async getAllFriendIdsInInvitations(id: string, _userId: string) {
        const meeting$ = from(this.meetingModel.findById(id).exec()).pipe(
            filter(item => Boolean(item)),
        );

        const invitations$ = meeting$.pipe(flatMap(item => item.invitations));

        const friends$ = invitations$.pipe(
            filter(item => Boolean(item.user) && !Boolean(item.email)),
            map(item => (item.user as Types.ObjectId).toHexString()),
        );

        return friends$.pipe(toArray()).toPromise();
    }

    async getAllUserJoinedMeetingInRange({
        userId,
        fromDate,
        toDate,
    }: {
        userId: string;
        fromDate: Date;
        toDate: Date;
    }) {
        const userObjId = Types.ObjectId(userId);
        return this.meetingModel
            .find({
                $and: [
                    {
                        status: {
                            $in: [
                                MeetingStatus.Planned,
                                MeetingStatus.Confirmed,
                                MeetingStatus.Started,
                            ],
                        },
                    },
                    {
                        plannedStartTime: { $gte: fromDate },
                        plannedEndTime: { $lte: toDate },
                    },
                    {
                        $or: [
                            {
                                owner: { $eq: userObjId },
                            },
                            {
                                $and: [
                                    { 'invitations.user': { $eq: userObjId } },
                                    {
                                        'invitations.status': {
                                            $in: [InvitationStatus.Accepted],
                                        },
                                    },
                                ],
                            },
                            {
                                'attendance.user': { $eq: userObjId },
                            },
                        ],
                    },
                ],
            })
            .exec();
    }

    async acceptOrRejectInvitation(
        meetingId: string,
        inviteeId: string,
        accept: boolean,
    ) {
        return from(this.meetingModel.findById(meetingId).exec())
            .pipe(
                flatMap(item => (item ? of(item) : empty())),
                flatMap(item => {
                    const inviteeIndex = item.invitations.findIndex(invitee =>
                        Types.ObjectId(inviteeId).equals(
                            invitee.user
                                ? (invitee.user as Types.ObjectId)
                                : '',
                        ),
                    );

                    if (inviteeIndex !== -1) {
                        item.invitations[inviteeIndex].status = accept
                            ? InvitationStatus.Accepted
                            : InvitationStatus.Declined;

                        return item.save();
                    }

                    return of(item);
                }),
            )
            .toPromise();
    }

    async updateDevice(meetingId: string, deviceId: string) {
        return this.meetingModel
            .findOneAndUpdate(
                {
                    _id: Types.ObjectId(meetingId),
                },
                {
                    device: Types.ObjectId(deviceId),
                },
            )
            .exec();
    }

    async clearRealEndTime(meetingId: string) {
        return this.meetingModel
            .findOneAndUpdate(
                {
                    _id: Types.ObjectId(meetingId),
                },
                {
                    $unset: { realEndTime: '' },
                },
            )
            .exec();
    }

    async isAvaialbeToBackToStart(meetingId: string, now: Date) {
        const oneHour = 1 * 60 * 60 * 1000;
        const meeting = await this.meetingModel.findById(meetingId);
        if (!meeting) {
            return false;
        }
        if (!meeting.realEndTime) {
            return true;
        }

        return new Date(meeting.realEndTime.getTime() + oneHour) >= now;
    }

    hasViewPermission(meetingId: string, userId: string) {
        const meetingObjectId = Types.ObjectId(meetingId);
        const userObjectId = Types.ObjectId(userId);
        const options = {
            $and: [
                { _id: { $eq: meetingObjectId } },
                { status: { $not: { $eq: MeetingStatus.Deleted } } },
                {
                    $or: [
                        {
                            owner: { $eq: userObjectId },
                        },
                        {
                            'invitations.user': { $eq: userObjectId },
                            'invitations.status': {
                                $in: [
                                    InvitationStatus.Accepted,
                                    InvitationStatus.Waiting,
                                ],
                            },
                        },
                        { 'attendance.user': { $eq: userObjectId } },
                    ],
                },
            ],
        };

        return from(this.meetingModel.countDocuments(options).exec()).pipe(
            map(n => n !== 0),
        );
    }
}
