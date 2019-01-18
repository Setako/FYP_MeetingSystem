import { Type } from 'class-transformer';
import { IsDate, IsDateString } from 'class-validator';

export class MeetingBusyTimeQueryDto {
    @IsDate()
    @Type(() => Date)
    fromDate: Date;

    @IsDate()
    @Type(() => Date)
    toDate: Date;
}
