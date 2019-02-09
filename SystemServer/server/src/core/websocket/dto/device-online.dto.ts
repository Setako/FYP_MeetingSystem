import { IsString, IsMongoId } from 'class-validator';

export class DeviceOnlineDto {
    @IsMongoId()
    readonly deviceId: string;

    @IsString()
    readonly secret: string;
}
