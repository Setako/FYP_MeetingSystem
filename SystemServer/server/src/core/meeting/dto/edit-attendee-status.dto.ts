import { IsEnum } from 'class-validator';
import { IsUsername } from '@commander/shared/decorator/is-username.decorator';
import { AttendanceStatus } from '../meeting.model';

export class EditAttendeeStatusDto {
    @IsUsername()
    readonly attendee: string;

    @IsEnum(AttendanceStatus)
    readonly status: AttendanceStatus;
}
