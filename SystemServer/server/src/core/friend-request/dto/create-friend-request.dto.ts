import { IsUsername } from '@commander/shared/decorator/is-username.decorator';
import { IsString, Length } from 'class-validator';

export class CreateFriendRequestDto {
    @IsString()
    @Length(2, 20)
    @IsUsername()
    readonly targetUser!: string;
}
