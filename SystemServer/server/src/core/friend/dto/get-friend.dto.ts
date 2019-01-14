import { Type, Exclude, Expose } from 'class-transformer';
import { SimpleUserDto } from '@commander/core/user/dto/simple-user.dto';

@Exclude()
export class GetFriendDto {
    @Expose()
    @Type(() => SimpleUserDto)
    user!: SimpleUserDto;

    @Expose()
    addDate!: Date;

    @Expose()
    stared!: boolean;

    constructor(partial: Partial<GetFriendDto>) {
        Object.assign(this, partial);
    }
}
