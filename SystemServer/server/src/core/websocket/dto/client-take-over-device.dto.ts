import { IsString, IsMongoId, IsOptional } from 'class-validator';
import { OwnerAuthDto } from './owner-auth.dto';

export class ClientTakeOverDeviceDto extends OwnerAuthDto {
    @IsString()
    readonly accessToken: string;

    @IsOptional()
    @IsString()
    readonly authenticationToken: string;

    @IsOptional()
    @IsMongoId()
    readonly meetingId: string;
}
