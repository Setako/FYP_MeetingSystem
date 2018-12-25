import { IsString, Length, IsEmail } from 'class-validator';
import { IsUsername } from '../../../decorator/is-username.decorator';

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
