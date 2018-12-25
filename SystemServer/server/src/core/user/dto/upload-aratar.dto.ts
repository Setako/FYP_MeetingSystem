import { IsString, IsBase64 } from 'class-validator';

export class UploadAratarDto {
    @IsString()
    readonly dataUrl: string;
}
