import {
    IsString,
    Length,
    IsEmail,
    ValidateNested,
    IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EditFriendDto } from './edit-friend.dto';

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

    @Type(() => EditFriendDto)
    @IsOptional()
    @ValidateNested()
    readonly friends?: EditFriendDto[];

    @IsOptional()
    readonly userMeetingRelation?: any[];

    @IsOptional()
    @IsString()
    readonly googleAccessToken?: string;
}
