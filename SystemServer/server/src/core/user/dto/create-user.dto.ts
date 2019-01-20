import { IsUsername } from '@commander/shared/decorator/is-username.decorator';
import { IsEmail, IsString, Length } from 'class-validator';

export class CreateUserDto {
    @IsUsername()
    readonly username!: string;

    @Length(8, 60)
    @IsString()
    readonly password!: string;

    @IsEmail()
    @IsString()
    readonly email!: string;
}
