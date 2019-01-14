import { IsBoolean } from 'class-validator';

export class AcceptFriendRequestDto {
    @IsBoolean()
    readonly accept: boolean;
}
