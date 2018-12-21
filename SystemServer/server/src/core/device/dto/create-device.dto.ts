import { IsString } from 'class-validator';

export class CreateDeviceDto {
    @IsString()
    readonly seceret: string;
}
