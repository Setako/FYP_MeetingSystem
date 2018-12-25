import {
    IsOptional,
    IsString,
    ValidateNested,
    IsInt,
    IsIn,
    IsArray,
    IsBoolean,
} from 'class-validator';

export class EditUserSettingDto {
    @IsOptional()
    @IsString()
    readonly markEventOnCalendarId?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested()
    // @Transform(val => {
    //     if (val === undefined) {
    //         return val;
    //     }
    //     if (!Array.isArray(val)) {
    //         return val;
    //     }
    //     return (val as CalendarImportanceDto[]).length === 0 ? [] : val;
    // })
    readonly calendarImportance: CalendarImportanceDto[];

    @IsOptional()
    @ValidateNested()
    readonly notification: {
        friendRequest: NotificationSettingDto;
        meetingInfoUpdate: NotificationSettingDto;
        meetingInvitation: NotificationSettingDto;
        meetingCancelled: NotificationSettingDto;
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
