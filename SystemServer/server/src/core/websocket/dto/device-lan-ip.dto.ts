import { IsString } from 'class-validator';

export class DeviceLanIpDto {
    @IsString()
    readonly lanIP: string;

    @IsString()
    readonly controlToken: string;
}
