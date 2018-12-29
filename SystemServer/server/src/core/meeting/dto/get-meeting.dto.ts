import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';
import { AccessPostMeetingPermission } from '../meeting.model';
import { AttendanceDto } from './attendance.dto';
import { GetOwnerDto } from './get-owner.dto';

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

    @Type(() => Types.ObjectId)
    @Transform((val: Types.ObjectId) => val.toHexString())
    device?: string;

    owner: GetOwnerDto;

    @Type(() => AttendanceDto)
    @Transform(arr => {
        return arr.map((attendance: { user: { username: any } }) => ({
            ...attendance,
            user: attendance.user.username,
        }));
    })
    attendance: AttendanceDto[];

    invitations: any[];

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
