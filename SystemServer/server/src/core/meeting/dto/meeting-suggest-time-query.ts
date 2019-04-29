import { Type } from 'class-transformer';
import { IsDate, IsIn, IsNumber, IsOptional } from 'class-validator';
import { MeetingBusyTimeQueryDto } from './meeting-busy-time-query.dto';
import { IsTimeString } from '@commander/shared/decorator/is-time-string.decorator';

export class MeetingSuggestTimeQuery extends MeetingBusyTimeQueryDto {
    @IsDate()
    @Type(() => Date)
    fromDate: Date;

    @IsDate()
    @Type(() => Date)
    toDate: Date;

    @IsTimeString()
    fromTime: string;

    @IsTimeString()
    toTime: string;

    @IsIn([0, 1, 2, 3, 4, 5, 6], {
        each: true,
    })
    @Type(() => Number)
    weekDays: number[];

    @IsNumber()
    @IsOptional()
    take?: number;
}
