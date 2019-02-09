import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType, InstanceType } from 'typegoose';
import uuidv4 from 'uuid/v4';
import { User } from '../user/user.model';
import { UserService } from '../user/user.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { EditMeetingDto } from './dto/edit-meeting.dto';
import { MeetingQueryDto } from './dto/meeting-query.dto';
import { InvitationsDto } from './dto/invitations.dto';
import {
    Invitation,
    InvitationStatus,
    Meeting,
    MeetingStatus,
    AttendanceStatus,
} from './meeting.model';
import { from, merge, identity, of, empty, defer } from 'rxjs';
import { map, flatMap, filter, toArray, tap } from 'rxjs/operators';
import { FriendService } from '../friend/friend.service';

@Injectable()
export class MeetingService {
    constructor(
        @InjectModel(Meeting) private readonly meetingModel: ModelType<Meeting>,
        private readonly userService: UserService,
        private readonly friendService: FriendService,
    ) {}

    async getById(id: string) {
        return this.meetingModel.findById(id).exec();
    }

    async getByIds(ids: string[]) {
        return this.meetingModel
            .find({
                _id: {
                    $in: ids,
                },
            })
            .exec();
    }

    async getByIdsWithPage(ids: string[], pageSize: number, pageNum = 1) {
        return this.meetingModel
            .find({
                _id: {
                    $in: ids,
                },
            })
            .skip(pageSize * (pageNum - 1))
            .limit(pageSize)
            .exec();
    }

    async getQueryOption(query: MeetingQueryDto, ownerId: string) {
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

                    const friends = await from(
                        this.friendService.getAllByUserId(ownerId),
                    )
                        .pipe(
                            flatMap(identity),
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

    async countDocumentsByIds(ids: string[]) {
        return this.meetingModel
            .find({
                _id: {
                    $in: ids,
                },
            })
            .countDocuments()
            .exec();
    }

    async countDocuments(options = {}) {
        return this.meetingModel
            .find(options)
            .countDocuments()
            .exec();
    }

    async getAll(options = {}) {
        return this.meetingModel.find(options).exec();
    }

    async getAllWithPage(pageSize: number, pageNum = 1, options = {}) {
        return this.meetingModel
            .find(options)
            .skip(pageSize * (pageNum - 1))
            .limit(pageSize)
            .exec();
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
        let edited = await this.meetingModel.findById(id);

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
            'status',
            'generalPermission',
        ].forEach(
            item => (edited[item] = editMeetingDto[item] || edited[item]),
        );

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

                    attendee.arrivalTime = arrivalTime;
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
            flatMap(item => from(this.userService.getByUsername(item))),
            filter(item => Boolean(item)),
            map(item => item.id as string),
        );

        const emailOnwerId$ = from(emails.values()).pipe(
            flatMap(email =>
                from(this.userService.getByEmail(email)).pipe(
                    filter(item => Boolean(item)),
                    map(item => item.id as string),
                ),
            ),
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
            flatMap(item => from(this.userService.getByUsername(item))),
            filter(Boolean.bind(Boolean)),
            map(item => ({
                id: uuidv4(),
                user: item._id,
                status: InvitationStatus.Waiting,
            })),
        );

        const emails$ = from(emails.values()).pipe(
            flatMap(email =>
                from(this.userService.getByEmail(email)).pipe(
                    map(user =>
                        user
                            ? {
                                  user: user._id,
                                  email,
                              }
                            : {
                                  email,
                              },
                    ),
                ),
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

    async hasViewPermission(meetingId: string, userId: string) {
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

        return from(this.meetingModel.countDocuments(options).exec())
            .pipe(map(n => n !== 0))
            .toPromise();
    }
}
