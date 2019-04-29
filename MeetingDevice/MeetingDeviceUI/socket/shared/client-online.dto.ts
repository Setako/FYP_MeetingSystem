import { IsString } from 'class-validator';

export class ClientOnlineDto {
    @IsString()
    readonly controlToken: string;
}
