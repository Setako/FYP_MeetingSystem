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
    @IsString()
    @IsOptional()
    readonly markEventOnCalendarId?: string;

    @ValidateNested()
    @IsArray()
    @IsOptional()
    readonly calendarImportance: CalendarImportanceDto[];

    @ValidateNested()
    @IsOptional()
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

    @IsIn([1, 2, 3])
    @IsInt()
    readonly importance: number;
}

class NotificationSettingDto {
    @IsBoolean()
    email: boolean;

    @IsBoolean()
    notification: boolean;
}
