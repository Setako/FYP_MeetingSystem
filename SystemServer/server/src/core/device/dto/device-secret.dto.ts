import { IsNotEmpty, IsString } from 'class-validator';

export class DeviceSecretDto {
    @IsNotEmpty()
    @IsString()
    readonly secret!: string;
}
