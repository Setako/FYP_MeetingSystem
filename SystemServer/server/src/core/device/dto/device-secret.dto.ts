import { IsNotEmpty, IsString } from 'class-validator';

export class DeviceSeceretDto {
    @IsNotEmpty()
    @IsString()
    readonly seceret!: string;
}
