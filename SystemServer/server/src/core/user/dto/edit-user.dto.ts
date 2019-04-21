import {
    IsEmail,
    IsOptional,
    IsString,
    Length,
    ValidateNested,
} from 'class-validator';
import { EditUserSettingDto } from './edit-user-setting.dto';

export class EditUserDto {
    @Length(8, 60)
    @IsString()
    @IsOptional()
    readonly password?: string;

    @IsEmail()
    @IsString()
    @IsOptional()
    readonly email?: string;

    @Length(2, 20)
    @IsString()
    @IsOptional()
    readonly displayName?: string;

    @IsOptional()
    readonly userMeetingRelation?: any[];

    @IsOptional()
    @ValidateNested()
    readonly setting?: EditUserSettingDto;
}
