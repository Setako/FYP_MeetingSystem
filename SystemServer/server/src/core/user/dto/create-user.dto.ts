import { IsUsername } from '@commander/shared/decorator/is-username.decorator';
import { IsEmail, IsString, Length } from 'class-validator';

export class CreateUserDto {
    @IsString()
    @Length(2, 20)
    @IsUsername()
    readonly username: string;

    @IsString()
    @Length(8, 60)
    readonly password: string;

    @IsString()
    @IsEmail()
    readonly email: string;
}
