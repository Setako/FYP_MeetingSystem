import { IsUsername } from '@commander/shared/decorator/is-username.decorator';
import {
    IsDate,
    IsArray,
    ValidateNested,
    ValidateIf,
    IsMongoId,
} from 'class-validator';
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
    @ValidateIf(obj => !obj.userId)
    @IsUsername()
    username?: string;

    @ValidateIf(obj => !obj.username)
    @IsMongoId()
    userId?: string;

    @ValidateIf((_obj, val) => val !== null)
    @IsDate()
    @Type(() => Date)
    time?: Date;
}
