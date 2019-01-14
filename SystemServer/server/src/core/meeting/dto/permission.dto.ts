import { IsBoolean } from 'class-validator';

export class PermissionDto {
    @IsBoolean()
    readonly accessShareResources!: boolean;

    @IsBoolean()
    readonly accessRecordedVoice!: boolean;

    @IsBoolean()
    readonly accessTextRecordOfSpeech!: boolean;

    @IsBoolean()
    readonly accessAttendanceRecord!: boolean;

    @IsBoolean()
    readonly makeMeetingMinute!: boolean;

    @IsBoolean()
    readonly reviewMeetingMinute!: boolean;
}
