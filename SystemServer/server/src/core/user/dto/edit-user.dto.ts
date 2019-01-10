import {
    IsEmail,
    IsOptional,
    IsString,
    Length,
    ValidateNested,
} from 'class-validator';
import { EditUserSettingDto } from './edit-user-setting.dto';

export class EditUserDto {
    @IsOptional()
    @IsString()
    @Length(8, 60)
    readonly password?: string;

    @IsOptional()
    @IsString()
    @IsEmail()
    readonly email?: string;

    @IsOptional()
    @IsString()
    @Length(2, 20)
    readonly displayName?: string;

    @IsOptional()
    readonly userMeetingRelation?: any[];

    @IsOptional()
    @IsString()
    readonly googleAccessToken?: string;

    @IsOptional()
    @ValidateNested()
    readonly setting?: EditUserSettingDto;
}
