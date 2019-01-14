import { IsUsername } from '@commander/shared/decorator/is-username.decorator';
import {
    IsEnum,
    IsIn,
    IsInt,
    IsISO8601,
    IsOptional,
    IsString,
    Length,
    ValidateNested,
} from 'class-validator';
import { AttendanceStatus } from '../meeting.model';
import { PermissionDto } from './permission.dto';

export class AttendanceDto {
    @IsString()
    @Length(2, 20)
    @IsUsername()
    readonly user!: string;

    @IsInt()
    @IsIn([1, 2, 3])
    readonly priority!: number;

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
