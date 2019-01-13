import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';
import { AccessPostMeetingPermission } from '../meeting.model';
import { AttendanceDto } from './attendance.dto';
import { SimpleUserDto } from '@commander/core/user/dto/simple-user.dto';
import { GetInvitationDto } from './get-invitation.dto';

export class GetMeetingDto {
    type: string;

    title: string;

    status: string;

    length: number;

    description?: string;

    plannedStartTime?: Date;

    plannedEndTime?: Date;

    realStartTime?: Date;

    realEndTime?: Date;

    language: string;

    priority: number;

    location?: string;

    // @Type(() => Types.ObjectId)
    @Transform((val: Types.ObjectId) => val.toHexString())
    device?: string;

    @Type(() => SimpleUserDto)
    owner: SimpleUserDto;

    @Type(() => AttendanceDto)
    @Transform(arr => {
        return arr.map((attendance: { user: { username: any } }) => ({
            ...attendance,
            user: attendance.user.username,
        }));
    })
    attendance: AttendanceDto[];

    @Type(() => GetInvitationDto)
    invitations: GetInvitationDto[];

    @Type(() => AccessPostMeetingPermission)
    generalPermission: AccessPostMeetingPermission;

    @Expose()
    get id(): string {
        return this._id.toHexString();
    }

    @Exclude()
    _id: Types.ObjectId;

    @Exclude()
    __v: number;

    constructor(partial: Partial<GetMeetingDto>) {
        Object.assign(this, partial);
    }
}
