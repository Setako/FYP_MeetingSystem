import { FriendRequestStatus } from '../friend-request.model';
import { Expose, Exclude, Type } from 'class-transformer';
import { ObjectId } from 'bson';
import { GetOwnerDto } from '../../meeting/dto/get-owner.dto';

export class GetFriendRequestDto {
    @Type(() => GetOwnerDto)
    user: GetOwnerDto;

    @Type(() => GetOwnerDto)
    targetUser: GetOwnerDto;

    status: FriendRequestStatus;

    requestTime: string;

    @Expose()
    get id(): string {
        return this._id.toHexString();
    }

    @Exclude()
    _id: ObjectId;

    @Exclude()
    __v: number;

    constructor(partial: Partial<GetFriendRequestDto>) {
        Object.assign(this, partial);
    }
}
