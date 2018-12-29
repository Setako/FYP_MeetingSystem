import { IsBoolean, IsISO8601, IsString } from 'class-validator';

export class EditFriendDto {
    @IsString()
    readonly friend: string;

    @IsISO8601()
    readonly addDate: string;

    @IsBoolean()
    readonly started: boolean;
}
