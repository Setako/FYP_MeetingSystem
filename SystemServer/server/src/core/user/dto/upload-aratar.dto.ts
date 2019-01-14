import { IsString } from 'class-validator';

export class UploadAratarDto {
    @IsString()
    readonly dataUrl: string;
}
