import { IsEnum } from 'class-validator';
import { AttendanceStatus } from '../meeting.model';

export class EditAttendeeStatusDto {
    @IsEnum(AttendanceStatus)
    readonly status: AttendanceStatus;
}
