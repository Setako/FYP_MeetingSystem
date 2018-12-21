import { IsString, Length, IsEmail } from 'class-validator';

export class CreateUserDto {
    @IsString()
    @Length(2, 20)
    readonly username: string;

    @IsString()
    @Length(8, 60)
    readonly password: string;

    @IsString()
    @IsEmail()
    readonly email: string;
}
