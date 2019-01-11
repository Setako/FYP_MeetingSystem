import { IsBooleanString, IsEnum, IsOptional } from 'class-validator';
import { MeetingStatus } from '../meeting.model';
import { PaginationQueryDto } from '@commander/shared/dto/pagination-query.dto';

export class MeetingQueryDto extends PaginationQueryDto {
    @IsOptional()
    @IsEnum(MeetingStatus, {
        each: true,
    })
    readonly status?: MeetingStatus[];

    @IsOptional()
    @IsBooleanString()
    readonly hostedByMe?: string;

    @IsOptional()
    @IsBooleanString()
    readonly hostedByOther?: string;
}
