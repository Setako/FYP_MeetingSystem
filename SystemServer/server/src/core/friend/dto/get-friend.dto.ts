import { Type } from 'class-transformer';
import { SimpleUserDto } from '@commander/core/user/dto/simple-user.dto';

export class GetFriendDto {
    @Type(() => SimpleUserDto)
    user: SimpleUserDto;

    addDate: Date;

    stared: boolean;

    constructor(partial: Partial<GetFriendDto>) {
        this.user = partial.user;
        this.addDate = partial.addDate;
        this.stared = partial.stared;
    }
}
