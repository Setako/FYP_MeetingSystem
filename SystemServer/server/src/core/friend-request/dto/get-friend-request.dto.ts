import { ObjectId } from 'bson';
import { Exclude, Expose, Type } from 'class-transformer';
import { FriendRequestStatus } from '../friend-request.model';
import { SimpleUserDto } from '@commander/core/user/dto/simple-user.dto';

@Exclude()
export class GetFriendRequestDto {
    @Expose()
    @Type(() => SimpleUserDto)
    user: SimpleUserDto;

    @Expose()
    @Type(() => SimpleUserDto)
    targetUser: SimpleUserDto;

    @Expose()
    status: FriendRequestStatus;

    @Expose()
    requestTime: string;

    @Expose()
    get id(): string {
        return this._id.toHexString();
    }

    _id: ObjectId;

    __v: number;

    constructor(partial: Partial<GetFriendRequestDto>) {
        Object.assign(this, partial);
    }
}
