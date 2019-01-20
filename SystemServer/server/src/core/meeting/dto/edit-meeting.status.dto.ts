import { IsEnum, IsString, IsOptional } from 'class-validator';
import { MeetingStatus } from '../meeting.model';

export class EditMeetingStatusDto {
    @IsEnum(MeetingStatus)
    readonly status: MeetingStatus;

    @IsString()
    @IsOptional()
    readonly deviceToken: string;
}
