import { PermissionDto } from './permission.dto';
import {
    IsString,
    IsOptional,
    IsISO8601,
    IsPositive,
    IsEnum,
    IsInt,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { AttendanceStatus } from '../meeting.model';

export class AttendanceDto {
    @IsString()
    readonly user: string;

    @IsInt()
    @IsPositive()
    readonly proiority: number;

    @IsOptional()
    @IsISO8601()
    @Transform(val => new Date(val))
    readonly arrivalTime?: Date;

    @IsOptional()
    @IsString()
    @IsEnum(AttendanceStatus)
    readonly status?: AttendanceStatus;

    @IsOptional()
    @IsString()
    readonly permission?: PermissionDto;
}
