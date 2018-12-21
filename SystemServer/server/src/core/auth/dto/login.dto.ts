import { IsString, Length } from 'class-validator';

export class LoginDto {
    @IsString()
    @Length(2, 20)
    readonly username: string;

    @IsString()
    @Length(8, 60)
    readonly password: string;
}
