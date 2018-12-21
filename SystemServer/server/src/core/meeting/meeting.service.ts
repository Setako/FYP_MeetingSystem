import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType } from 'typegoose';
import {
    Meeting,
    AccessPostMeetingPermission,
    MeetingStatus,
    InvitationStatus,
    Invitation,
} from './meeting.model';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { User } from '../user/user.model';
import { EditMeetingDto } from './dto/edit-meeting.dto';
import { UserService } from '../user/user.service';
import { InvitationsDto } from './dto/invitations.dto';
import uuidv4 from 'uuid/v4';
import { GetAllQueryDto } from './dto/get-all-query.dto';
import { Types } from 'mongoose';

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
        return Promise.all(ids.map(async id => this.meetingModel.findById(id)));
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

    async getQueryOption(query: GetAllQueryDto, owner: string) {
        const ownerId = (await this.userService.getByUsername(owner)).id;

        const options = {} as any;

        if (query.status) {
            options.status = query.status;
        }

        const hostedByMe = query.hostedByMe === 'true';
        const hostedByOther = query.hostedByOther === 'true';

        if (hostedByMe && hostedByOther) {
            options.$or = [
                {
                    owner: { $eq: Types.ObjectId(ownerId) },
                },
                {
                    'attendance.user': { $eq: Types.ObjectId(ownerId) },
                },
            ];
        } else if (!hostedByMe && query.hostedByMe !== undefined) {
            options.owner = {
                $not: {
                    $eq: Types.ObjectId(ownerId),
                },
            };
        } else if (hostedByOther) {
            options['attendance.user'] = { $eq: Types.ObjectId(ownerId) };
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
        const {
            language = 'en-US',
            priority = 1,
            generalPermission,
        } = createMeetingDto;

        const meeting = new this.meetingModel({
            ...createMeetingDto,
            language,
            priority,
            owner,
            generalPermission:
                generalPermission ||
                new AccessPostMeetingPermission(
                    true,
                    true,
                    true,
                    true,
                    true,
                    true,
                ),
            status: MeetingStatus.Draft,
        });

        return meeting.save();
    }

    async edit(id: string, editMeetingDto: EditMeetingDto) {
        let edited = await this.meetingModel.findById(id);
        await Promise.all(
            Object.keys(editMeetingDto).map(async key => {
                if (editMeetingDto[key]) {
                    if (key === 'attendance') {
                        edited.attendance = (await Promise.all(
                            editMeetingDto.attendance.map(async item => ({
                                ...item,
                                user: await this.userService.getByUsername(
                                    item.user,
                                ),
                                permission:
                                    item.permission || edited.generalPermission,
                            })),
                        )).filter(
                            item => item.user && item.user.id !== edited.owner,
                        );

                        return;
                    }

                    if (key === 'invitations') {
                        await edited.save();
                        edited = await this.editInvitations(
                            edited.id,
                            editMeetingDto[key],
                        );
                        return;
                    }

                    edited[key] = editMeetingDto[key];
                }
            }),
        );

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
}
