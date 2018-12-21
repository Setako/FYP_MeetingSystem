import {
    IsString,
    Length,
    IsEmail,
    ValidateNested,
    IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateFriendDto } from './update-friend.dto';

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

    @Type(() => UpdateFriendDto)
    @IsOptional()
    @ValidateNested()
    readonly friends?: UpdateFriendDto[];

    @IsOptional()
    readonly userMeetingRelation?: [];

    @IsOptional()
    googleAccessToken?: string;
}
