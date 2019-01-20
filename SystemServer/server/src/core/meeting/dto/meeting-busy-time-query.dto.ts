import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';

export class MeetingBusyTimeQueryDto {
    @IsDate()
    @Type(() => Date)
    fromDate: Date;

    @IsDate()
    @Type(() => Date)
    toDate: Date;
}
