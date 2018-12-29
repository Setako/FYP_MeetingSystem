import {
    IsEnum,
    IsInt,
    IsOptional,
    IsPositive,
    IsString,
    MinLength,
    ValidateNested,
} from 'class-validator';
import { MeetingType } from '../meeting.model';
import { PermissionDto } from './permission.dto';

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

    @IsOptional()
    @IsString()
    readonly location?: string;

    @IsOptional()
    @IsString()
    readonly language?: string;

    @IsInt()
    @IsPositive()
    readonly priority: number;

    @IsOptional()
    @ValidateNested()
    readonly generalPermission?: PermissionDto;
}
