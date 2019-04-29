import { IsString, IsMongoId, IsOptional } from 'class-validator';
import { MeetingAuthDto } from './owner-auth.dto';

export class ClientTakeOverDeviceDto extends MeetingAuthDto {
    @IsString()
    readonly accessToken: string;

    @IsOptional()
    @IsString()
    readonly authenticationToken: string;

    @IsOptional()
    @IsMongoId()
    readonly meetingId: string;
}
