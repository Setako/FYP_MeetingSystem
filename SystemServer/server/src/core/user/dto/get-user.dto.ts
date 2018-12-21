import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { ObjectId } from 'bson';
import { UpdateFriendDto } from './update-friend.dto';

export class GetUserDto {
    username: string;
    email: string;
    displayName: string;

    userMeetingRelation: [];

    @Type(() => UpdateFriendDto)
    @Transform(arr => {
        return arr.map((friend: { friend: { username: any } }) => ({
            ...friend,
            friend: friend.friend.username,
        }));
    })
    friends: UpdateFriendDto[];

    @Expose()
    get id(): string {
        return this._id.toHexString();
    }

    @Exclude()
    _id: ObjectId;

    @Exclude()
    password: string;

    @Exclude()
    salt: string;

    @Exclude()
    tokenVerificationCode: string;

    @Exclude()
    googleAccessToken?: string;

    @Exclude()
    __v: number;

    constructor(partial: Partial<GetUserDto>) {
        Object.assign(this, partial);
    }

    static of(partial: Partial<GetUserDto>) {
        return new GetUserDto(partial);
    }
}
