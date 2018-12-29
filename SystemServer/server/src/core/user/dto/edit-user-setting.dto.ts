import {
    IsArray,
    IsBoolean,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';

export class EditUserSettingDto {
    @IsOptional()
    @IsString()
    readonly markEventOnCalendarId?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested()
    readonly calendarImportance: CalendarImportanceDto[];

    @IsOptional()
    @ValidateNested()
    readonly notification: {
        friendRequest: NotificationSettingDto;
        meetingInfoUpdate: NotificationSettingDto;
        meetingInvitation: NotificationSettingDto;
        meetingCancelled: NotificationSettingDto;
        meetingReminder: NotificationSettingDto;
    };
}

class CalendarImportanceDto {
    @IsString()
    readonly carlendarId: string;

    @IsInt()
    @IsIn([1, 2, 3])
    readonly importance: number;
}

class NotificationSettingDto {
    @IsBoolean()
    email: boolean;

    @IsBoolean()
    notification: boolean;
}
