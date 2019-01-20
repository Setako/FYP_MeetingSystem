import { Type } from 'class-transformer';
import {
    IsEnum,
    IsInstance,
    IsInt,
    IsISO8601,
    IsOptional,
    IsPositive,
    IsString,
    MinLength,
    ValidateNested,
} from 'class-validator';
import { MeetingStatus, MeetingType, MeetingPriority } from '../meeting.model';
import { InvitationsDto } from './invitations.dto';
import { PermissionDto } from './permission.dto';

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
    @IsEnum(MeetingPriority)
    readonly priority?: number;

    @IsOptional()
    @ValidateNested()
    readonly generalPermission?: PermissionDto;

    @IsOptional()
    @IsEnum(MeetingStatus)
    readonly status?: MeetingStatus;

    @IsOptional()
    @IsISO8601()
    readonly plannedStartTime?: string;

    @IsOptional()
    @IsISO8601()
    readonly plannedEndTime?: string;

    @IsOptional()
    @IsISO8601()
    readonly realStartTime?: string;

    @IsOptional()
    @IsISO8601()
    readonly realEndTime?: string;

    @IsOptional()
    @IsInstance(InvitationsDto)
    @ValidateNested()
    @Type(() => InvitationsDto)
    readonly invitations?: InvitationsDto;
}
