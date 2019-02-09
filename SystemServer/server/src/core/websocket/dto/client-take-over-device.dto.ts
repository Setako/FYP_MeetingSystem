import { IsString, IsMongoId } from 'class-validator';

export class ClientTakeOverDeviceDto {
    @IsString()
    readonly authenticationToken: string;

    @IsString()
    readonly accessToken: string;

    @IsMongoId()
    readonly meetingId: string;
}
