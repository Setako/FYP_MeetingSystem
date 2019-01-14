import {
    IsEnum,
    IsInt,
    IsOptional,
    IsPositive,
    IsString,
    MinLength,
} from 'class-validator';
import { MeetingType, MeetingPriority } from '../meeting.model';

export class CreateMeetingDto {
    @IsEnum(MeetingType)
    readonly type: MeetingType;

    @IsString()
    @MinLength(1)
    readonly title: string;

    @IsString()
    readonly description: string;

    @IsInt()
    @IsPositive()
    readonly length: number;

    @IsString()
    @IsOptional()
    readonly location?: string;

    @IsString()
    @IsOptional()
    readonly language?: string;

    @IsEnum(MeetingPriority)
    readonly priority: number;
}
