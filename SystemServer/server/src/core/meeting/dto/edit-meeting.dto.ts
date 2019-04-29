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
    Allow,
} from 'class-validator';
import { MeetingStatus, MeetingType, MeetingPriority } from '../meeting.model';
import { InvitationsDto } from './invitations.dto';
import { PermissionDto } from './permission.dto';
import { MeetingResourcesDto } from './meeting-resouces.dto';

class MeetingResources {
    @IsOptional()
    @ValidateNested()
    @Type(() => MeetingResourcesDto)
    main?: MeetingResourcesDto;

    @Allow()
    @Type(() => MeetingResourcesDto)
    user?: Map<string, MeetingResourcesDto>;

    @Allow()
    @Type(() => MeetingResourcesDto)
    group?: Map<string, MeetingResourcesDto>;
}

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

    @IsOptional()
    @ValidateNested()
    @Type(() => MeetingResourcesDto)
    readonly mainResources?: MeetingResourcesDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => MeetingResources)
    readonly resources?: MeetingResources;

    @IsOptional()
    @IsString()
    readonly agendaGoogleResourceId?: string;
}
