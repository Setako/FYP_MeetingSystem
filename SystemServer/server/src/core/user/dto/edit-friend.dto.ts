import { IsString, IsBoolean, IsISO8601 } from 'class-validator';

export class EditFriendDto {
    @IsString()
    readonly friend: string;

    @IsISO8601()
    readonly addDate: string;

    @IsBoolean()
    readonly started: boolean;
}
