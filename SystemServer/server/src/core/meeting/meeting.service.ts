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
import { from, merge } from 'rxjs';
import { map, flatMap, filter, toArray } from 'rxjs/operators';

@Injectable()
export class MeetingService {
    constructor(
        @InjectModel(Meeting) private readonly meetingModel: ModelType<Meeting>,
        private readonly userService: UserService,
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

    async getQueryOption(query: MeetingQueryDto, owner: string) {
        const ownerId = (await this.userService.getByUsername(owner)).id;

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

        if (invitingMe) {
            options = {
                ...options,
                'invitations.user': { $eq: Types.ObjectId(ownerId) },
                'invitations.status': InvitationStatus.Waiting,
                owner: {
                    $not: {
                        $eq: Types.ObjectId(ownerId),
                    },
                },
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

        if (editMeetingDto.attendance) {
            edited.attendance = (await Promise.all(
                editMeetingDto.attendance.map(async item => ({
                    ...item,
                    arrivalTime: new Date(item.arrivalTime),
                    user: await this.userService.getByUsername(item.user),
                    permission: item.permission || edited.generalPermission,
                })),
            )).filter(item => item.user);
        }

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
        edited.generalPermission =
            editMeetingDto.generalPermission || edited.generalPermission;

        if (
            edited.status !== MeetingStatus.Draft &&
            edited.attendance.some(att => att.user === edited.owner)
        ) {
            edited.attendance.push({
                user: edited.owner,
                priority: 1,
                permission: edited.generalPermission,
            });
        }

        return edited.save();
    }

    async delete(id: string) {
        const deleted = await this.meetingModel.findById(id);
        return deleted.remove();
    }

    async editInvitations(meetingId: string, invitations: InvitationsDto) {
        const meeting = await this.meetingModel
            .findById(meetingId)
            .populate('invitations.user')
            .exec();

        const emails = new Set(invitations.emails);
        const friends = new Set(invitations.friends);

        const kept$ = from(meeting.invitations).pipe(
            filter(item => {
                const user: InstanceType<User> = item.user as any;
                const hasEmail = emails.delete(item.email);
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
                user: item,
                status: InvitationStatus.Waiting,
            })),
        );

        const emails$ = from(emails.values()).pipe(
            flatMap(email =>
                from(this.userService.getByEmail(email)).pipe(
                    map(user =>
                        user
                            ? {
                                  user,
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

        // const emails$ = from(emails.values()).pipe(
        //     map(item => ({
        //         id: uuidv4(),
        //         email: item,
        //         status: InvitationStatus.Waiting,
        //     })),
        // );

        meeting.invitations = (await merge(kept$, friends$, emails$)
            .pipe(toArray())
            .toPromise()) as Invitation[];

        return meeting.save();
    }

    async hasViewPermission(meetingId: string, userId: string) {
        const meetingObjectId = Types.ObjectId(meetingId);
        const userObjectId = Types.ObjectId(userId);
        const options = {
            $and: [
                { _id: { $eq: meetingObjectId } },
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
