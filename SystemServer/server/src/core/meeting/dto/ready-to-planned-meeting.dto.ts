import {
    IsString,
    MinLength,
    IsNumber,
    IsDate,
    IsNotEmpty,
    ArrayNotEmpty,
    ArrayMinSize,
} from 'class-validator';
import { MeetingStatus, Invitation } from '../meeting.model';

export class ReadyToPlannedMeetingDto {
    @IsString()
    @IsNotEmpty()
    readonly type!: string;

    @IsString()
    @MinLength(1)
    @IsNotEmpty()
    readonly title!: string;

    @IsNotEmpty()
    readonly status!: MeetingStatus;

    @IsNumber()
    @IsNotEmpty()
    readonly length!: number;

    @IsDate()
    @IsNotEmpty()
    readonly plannedStartTime!: Date;

    @ArrayMinSize(1)
    @ArrayNotEmpty()
    readonly invitations!: Invitation[];
}
