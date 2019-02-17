import { IsEnum, IsString, IsOptional } from 'class-validator';
import {
    MeetingOrderBy,
    MeetingSortBy,
} from '@commander/core/meeting/dto/meeting-query.dto';

export enum SearchType {
    Meeting = 'meeting',
    User = 'user',
}

export class SearchQueryDto {
    @IsEnum(SearchType)
    type: SearchType;

    @IsString()
    q: string;

    @IsEnum(MeetingSortBy)
    @IsOptional()
    sortBy?: string;

    @IsEnum(MeetingOrderBy)
    @IsOptional()
    orderBy?: MeetingOrderBy;
}
