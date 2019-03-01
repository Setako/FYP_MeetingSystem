import { IsUsername } from '@commander/shared/decorator/is-username.decorator';
import { IsDate, IsArray, ValidateNested, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class MarkAttendanceDto {
    @IsArray()
    @ValidateNested({
        each: true,
    })
    @Type(() => Attendance)
    attendance: Attendance[];
}

class Attendance {
    @IsUsername()
    username: string;

    @ValidateIf((_obj, val) => val !== null)
    @IsDate()
    @Type(() => Date)
    time: Date;
}
