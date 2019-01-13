import { IsUsername } from '@commander/shared/decorator/is-username.decorator';
import { IsEmail, IsString, Length } from 'class-validator';

export class CreateUserDto {
    @IsUsername()
    @Length(2, 20)
    @IsString()
    readonly username: string;

    @Length(8, 60)
    @IsString()
    readonly password: string;

    @IsEmail({
        allow_display_name: true,
        allow_utf8_local_part: true,
        require_tld: false,
    })
    @IsString()
    readonly email: string;
}
