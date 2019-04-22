import {
    IsArray,
    IsBoolean,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PrivacySetting {
    @IsBoolean()
    readonly allowOtherToSendFirendRequest: boolean;
}

class NotificationSettingDto {
    @IsBoolean()
    readonly email!: boolean;

    @IsBoolean()
    readonly notification!: boolean;
}

export class NotificationSetting {
    @ValidateNested()
    @Type(() => NotificationSettingDto)
    readonly friendRequest: NotificationSettingDto;
    @ValidateNested()
    @Type(() => NotificationSettingDto)
    readonly meetingInfoUpdate: NotificationSettingDto;
    @ValidateNested()
    @Type(() => NotificationSettingDto)
    readonly meetingInvitation: NotificationSettingDto;
    @ValidateNested()
    @Type(() => NotificationSettingDto)
    readonly meetingCancelled: NotificationSettingDto;
    @ValidateNested()
    @Type(() => NotificationSettingDto)
    readonly meetingReminder: NotificationSettingDto;
}

export class EditUserSettingDto {
    @IsString()
    @IsOptional()
    readonly markEventOnCalendarId?: string;

    @ValidateNested()
    @IsArray()
    @IsOptional()
    @Type(() => CalendarImportanceDto)
    readonly calendarImportance?: CalendarImportanceDto[];

    @IsOptional()
    @ValidateNested()
    @Type(() => NotificationSetting)
    readonly notification?: NotificationSetting;

    @IsOptional()
    @ValidateNested()
    @Type(() => PrivacySetting)
    readonly privacy?: PrivacySetting;
}

class CalendarImportanceDto {
    @IsString()
    readonly calendarId!: string;

    @IsIn([1, 2, 3])
    @IsInt()
    readonly importance!: number;
}
