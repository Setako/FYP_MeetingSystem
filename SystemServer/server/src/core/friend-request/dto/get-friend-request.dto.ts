import { ObjectId } from 'bson';
import { Exclude, Expose, Type, Transform } from 'class-transformer';
import { FriendRequestStatus } from '../friend-request.model';
import { SimpleUserDto } from '@commander/core/user/dto/simple-user.dto';

@Exclude()
export class GetFriendRequestDto {
    @Expose()
    @Type(() => SimpleUserDto)
    user!: SimpleUserDto;

    @Expose()
    @Type(() => SimpleUserDto)
    targetUser!: SimpleUserDto;

    @Expose()
    status!: FriendRequestStatus;

    @Expose()
    requestTime!: string;

    @Expose()
    @Transform((_val, obj) => obj._id.toHexString())
    id: string;

    _id!: ObjectId;

    __v!: number;

    constructor(partial: Partial<GetFriendRequestDto>) {
        Object.assign(this, partial);
    }
}
