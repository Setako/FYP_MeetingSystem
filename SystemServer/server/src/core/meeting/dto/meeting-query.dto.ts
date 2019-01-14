import { IsBooleanString, IsEnum, IsOptional } from 'class-validator';
import { MeetingStatus } from '../meeting.model';
import { PaginationQueryDto } from '@commander/shared/dto/pagination-query.dto';

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
}
