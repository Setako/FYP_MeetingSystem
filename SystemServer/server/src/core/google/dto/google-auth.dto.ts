import { IsString, IsNotEmpty } from 'class-validator';

export class GoogleAuthDto {
    @IsString()
    @IsNotEmpty()
    readonly state!: string;

    @IsString()
    @IsNotEmpty()
    readonly code!: string;

    @IsString()
    @IsNotEmpty()
    readonly scope!: string;
}
