import { IsString, IsMongoId } from 'class-validator';

export class MeetingAuthDto {
    @IsString()
    readonly authenticationToken: string;

    @IsMongoId()
    readonly meetingId: string;
}
