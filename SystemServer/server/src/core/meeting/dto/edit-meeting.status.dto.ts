import { IsEnum } from 'class-validator';
import { MeetingStatus } from '../meeting.model';

export class EditMeetingStatusDto {
    @IsEnum(MeetingStatus)
    readonly status: MeetingStatus;
}
