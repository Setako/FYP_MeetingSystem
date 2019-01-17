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
} from './meeting.model';
import { from, merge, identity, of, empty } from 'rxjs';
import { map, flatMap, filter, toArray } from 'rxjs/operators';
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
        return this.meetingModel
            .find(options)
            .populate('owner invitation.owner')
            .exec();
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

        // TODO: handle the attendance
        // if (editMeetingDto.attendance) {
        //     edited.attendance = (await Promise.all(
        //         editMeetingDto.attendance.map(async item => ({
        //             ...item,
        //             arrivalTime: new Date(item.arrivalTime),
        //             user: await this.userService.getByUsername(item.user),
        //             permission: item.permission || edited.generalPermission,
        //         })),
        //     )).filter(item => item.user);
        // }

        if (editMeetingDto.invitations) {
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
        edited.plannedEndTime = editMeetingDto.plannedEndTime
            ? new Date(editMeetingDto.plannedEndTime)
            : edited.plannedEndTime;
        edited.realStartTime = editMeetingDto.realStartTime
            ? new Date(editMeetingDto.realStartTime)
            : edited.realStartTime;
        edited.realEndTime = editMeetingDto.realEndTime
            ? new Date(editMeetingDto.realEndTime)
            : edited.realEndTime;

        // TODO: handle the owner attendance
        // if (
        //     edited.status !== MeetingStatus.Draft &&
        //     edited.attendance.some(att => att.user === edited.owner)
        // ) {
        //     edited.attendance.push({
        //         user: edited.owner,
        //         priority: 1,
        //         permission: edited.generalPermission,
        //     });
        // }

        return edited.save();
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

    async editInvitations(meetingId: string, invitations: InvitationsDto) {
        const meeting = await this.meetingModel
            .findById(meetingId)
            .populate('owner invitations.user')
            .exec();

        if (!meeting) {
            return null;
        }

        const emails = new Set(invitations.emails);
        const friends = new Set(invitations.friends);

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
