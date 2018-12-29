import { GetOwnerDto } from '@commander/core/meeting/dto/get-owner.dto';
import { ObjectId } from 'bson';
import { Exclude, Expose, Type } from 'class-transformer';
import { FriendRequestStatus } from '../friend-request.model';

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
