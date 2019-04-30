import { IsString } from 'class-validator';

export class RecognitionOnlineDto {
    @IsString()
    recognitionToken: string;
}
