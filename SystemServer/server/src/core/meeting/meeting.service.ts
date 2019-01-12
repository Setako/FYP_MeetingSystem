import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType } from 'typegoose';
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
import { from } from 'rxjs';
import { map } from 'rxjs/operators';

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
                'owner': {
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

        edited.type = editMeetingDto.type || edited.type;
        edited.title = editMeetingDto.title || edited.title;
        edited.description = editMeetingDto.description || edited.description;
        edited.length = editMeetingDto.length || edited.length;
        edited.location = editMeetingDto.location || edited.location;
        edited.language = editMeetingDto.language || edited.language;
        edited.priority = editMeetingDto.priority || edited.priority;
        edited.status = editMeetingDto.status || edited.status;
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

        // Todo: when the meeting change to planned, add host to attendance
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
        const meeting = await this.meetingModel.findById(meetingId);

        meeting.invitations = [];

        meeting.invitations.concat(((await Promise.all(
            invitations.friends.map(async friend => ({
                id: uuidv4(),
                user: await this.userService.getByUsername(friend),
                status: InvitationStatus.Waiting,
            })),
        )) as unknown) as Invitation[]);

        meeting.invitations = meeting.invitations.concat(invitations.emails.map(
            email => ({
                id: uuidv4(),
                email,
                status: InvitationStatus.Waiting,
            }),
        ) as Invitation[]);

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
