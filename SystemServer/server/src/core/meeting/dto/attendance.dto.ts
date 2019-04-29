import { AttendanceStatus } from '../meeting.model';
import { PermissionDto } from './permission.dto';
import { SimpleUserDto } from '@commander/core/user/dto/simple-user.dto';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class AttendanceDto {
    @Expose()
    @Type(() => SimpleUserDto)
    user!: SimpleUserDto;

    @Expose()
    priority?: number;

    @Expose()
    @Type(() => Date)
    arrivalTime?: Date;

    @Expose()
    status?: AttendanceStatus;

    @Expose()
    @Type(() => PermissionDto)
    permission?: PermissionDto;

    googleCalendarEventId?: string;

    isFitTrainedModel?: boolean;
}
