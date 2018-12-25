import { IsString, Length } from 'class-validator';
import { IsUsername } from '../../../decorator/is-username.decorator';

export class CreateFriendRequestDto {
    @IsString()
    @Length(2, 20)
    @IsUsername()
    readonly targetUser: string;
}
