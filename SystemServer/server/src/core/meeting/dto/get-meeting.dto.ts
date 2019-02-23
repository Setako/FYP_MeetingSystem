import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';
import {
    AccessPostMeetingPermission,
    MeetingResources,
    MeetingStatus,
    Resources,
} from '../meeting.model';
import { AttendanceDto } from './attendance.dto';
import { SimpleUserDto } from '@commander/core/user/dto/simple-user.dto';
import { GetInvitationDto } from './get-invitation.dto';
import { User } from '@commander/core/user/user.model';
import { InstanceType } from 'typegoose';

export class GetMeetingDto {
    type!: string;

    title!: string;

    status!: MeetingStatus;

    length!: number;

    description?: string;

    plannedStartTime?: Date;

    plannedEndTime?: Date;

    realStartTime?: Date;

    realEndTime?: Date;

    language!: string;

    priority!: number;

    location?: string;

    @Transform((val: Types.ObjectId) => val.toHexString())
    device?: string;

    @Type(() => SimpleUserDto)
    owner!: SimpleUserDto;

    @Type(() => AttendanceDto)
    attendance!: AttendanceDto[];

    @Type(() => GetInvitationDto)
    invitations!: GetInvitationDto[];

    @Type(() => AccessPostMeetingPermission)
    generalPermission!: AccessPostMeetingPermission;

    @Transform((val: MeetingResources) => ({
        ...val,
        user: new Map(
            val.user.map(
                ({ sharer, resources }) =>
                    [(sharer as InstanceType<User>).username, resources] as [
                        string,
                        Resources
                    ],
            ),
        ),
        group: new Map(val.group),
    }))
    public resources: object;

    @Expose()
    get id(): string {
        return this._id.toHexString();
    }

    @Exclude()
    _id!: Types.ObjectId;

    @Exclude()
    __v!: number;

    constructor(partial: Partial<GetMeetingDto>) {
        Object.assign(this, partial);
    }
}
