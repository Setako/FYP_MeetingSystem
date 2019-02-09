import { IsIP, IsString } from 'class-validator';

export class DeviceLanIpDto {
    @IsIP()
    readonly lanIP: string;

    @IsString()
    readonly controlToken: string;
}
