import { Type } from 'class-transformer';
import { IsDate, IsIn, IsNumber, IsOptional } from 'class-validator';
import { MeetingBusyTimeQueryDto } from './meeting-busy-time-query.dto';

export class MeetingSuggestTimeQuery extends MeetingBusyTimeQueryDto {
    @IsDate()
    @Type(() => Date)
    fromDate: Date;

    @IsDate()
    @Type(() => Date)
    toDate: Date;

    @IsIn([0, 1, 2, 3, 4, 5, 6], {
        each: true,
    })
    @Type(() => Number)
    weekDays: number[];

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    take?: number;
}
