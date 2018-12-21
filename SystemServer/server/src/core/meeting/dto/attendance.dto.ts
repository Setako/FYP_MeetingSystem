import { PermissionDto } from './permission.dto';
import {
    IsString,
    IsOptional,
    IsISO8601,
    IsEnum,
    IsInt,
    Length,
    IsIn,
    ValidateNested,
} from 'class-validator';
import { AttendanceStatus } from '../meeting.model';

export class AttendanceDto {
    @IsString()
    @Length(2, 20)
    readonly user: string;

    @IsInt()
    @IsIn([1, 2, 3])
    readonly proiority: number;

    @IsOptional()
    @IsISO8601()
    readonly arrivalTime?: string;

    @IsOptional()
    @IsEnum(AttendanceStatus)
    readonly status?: AttendanceStatus;

    @IsOptional()
    @ValidateNested()
    readonly permission?: PermissionDto;

    @IsOptional()
    @IsString()
    readonly googleCalendarEventId?: string;
}
