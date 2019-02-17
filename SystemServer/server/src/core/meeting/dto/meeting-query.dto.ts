import { IsBooleanString, IsEnum, IsOptional, IsString } from 'class-validator';
import { MeetingStatus } from '../meeting.model';
import { PaginationQueryDto } from '@commander/shared/dto/pagination-query.dto';

export enum MeetingSortBy {
    Date = 'date',
    Title = 'title',
    Owner = 'owner',
}

export enum MeetingOrderBy {
    DESC = 'desc',
    ASC = 'asc',
}

export class MeetingQueryDto extends PaginationQueryDto {
    @IsEnum(MeetingStatus, {
        each: true,
    })
    @IsOptional()
    readonly status?: MeetingStatus[];

    @IsBooleanString()
    @IsOptional()
    readonly hostedByMe?: string;

    @IsBooleanString()
    @IsOptional()
    readonly hostedByOther?: string;

    @IsBooleanString()
    @IsOptional()
    readonly invitingMe?: string;

    @IsBooleanString()
    @IsOptional()
    readonly invitingFromFriend?: string;

    @IsEnum(MeetingSortBy)
    @IsString()
    @IsOptional()
    readonly sortBy?: MeetingSortBy;

    @IsEnum(MeetingOrderBy)
    @IsString()
    @IsOptional()
    readonly orderBy?: MeetingOrderBy;
}
