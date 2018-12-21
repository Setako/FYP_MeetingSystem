import {
    IsOptional,
    IsNumberString,
    IsBooleanString,
    IsEnum,
} from 'class-validator';
import { MeetingStatus } from '../meeting.model';

export class GetAllQueryDto {
    @IsOptional()
    @IsNumberString()
    readonly resultPageNum?: string;

    @IsOptional()
    @IsNumberString()
    readonly resultPageSize?: string;

    @IsOptional()
    @IsEnum(MeetingStatus)
    readonly status?: MeetingStatus;

    @IsOptional()
    @IsBooleanString()
    readonly hostedByMe?: string;

    @IsOptional()
    @IsBooleanString()
    readonly hostedByOther?: string;
}
