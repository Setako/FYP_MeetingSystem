import { IsString, IsBoolean } from 'class-validator';

export class UpdateFriendDto {
    @IsString()
    readonly friend: string;

    @IsString()
    readonly addDate: string;

    @IsBoolean()
    readonly started: boolean;
}
