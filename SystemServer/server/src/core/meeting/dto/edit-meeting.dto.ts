import {
    IsEnum,
    IsString,
    MinLength,
    IsPositive,
    IsOptional,
    ValidateNested,
    IsISO8601,
    IsInt,
} from 'class-validator';
import { MeetingType, MeetingStatus } from '../meeting.model';
import { PermissionDto } from './permission.dto';
import { Transform, Type } from 'class-transformer';
import { AttendanceDto } from './attendance.dto';
import { InvitationsDto } from './invitations.dto';

export class EditMeetingDto {
    @IsOptional()
    @IsEnum(MeetingType)
    readonly type?: MeetingType;

    @IsOptional()
    @IsString()
    @MinLength(1)
    readonly title?: string;

    @IsOptional()
    @IsString()
    readonly description?: string;

    @IsOptional()
    @IsInt()
    @IsPositive()
    readonly length?: number;

    @IsOptional()
    @IsString()
    readonly location?: string;

    @IsOptional()
    @IsString()
    readonly language?: string;

    @IsOptional()
    @IsInt()
    @IsPositive()
    readonly priority?: number;

    @IsOptional()
    @ValidateNested()
    readonly generalPermission?: PermissionDto;

    @IsOptional()
    @IsEnum(MeetingStatus)
    readonly status?: MeetingStatus;

    @IsOptional()
    @IsISO8601()
    @Transform(val => new Date(val))
    readonly plannedStartTime?: Date;

    @IsOptional()
    @IsISO8601()
    @Transform(val => new Date(val))
    readonly plannedEndTime?: Date;

    @IsOptional()
    @IsISO8601()
    @Transform(val => new Date(val))
    readonly realStartTime?: Date;

    @IsOptional()
    @IsISO8601()
    @Transform(val => new Date(val))
    readonly realEndTime?: Date;

    @Type(() => AttendanceDto)
    @IsOptional()
    @ValidateNested()
    readonly attendance?: AttendanceDto[];

    @IsOptional()
    @ValidateNested()
    readonly invitations?: InvitationsDto;
}
