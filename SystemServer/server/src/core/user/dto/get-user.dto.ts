import { Exclude, Expose } from 'class-transformer';
import { ObjectId } from 'bson';
import { UserSetting } from '../user.model';

export class GetUserDto {
    username: string;
    email: string;
    displayName: string;

    userMeetingRelation: [];

    // @Type(() => EditFriendDto)
    // @Transform(
    //     arr => {
    //         return arr.map((friend: { friend: { username: any } }) => ({
    //             ...friend,
    //             friend: friend.friend.username,
    //         }));
    //     },
    //     { toPlainOnly: true },
    // )
    @Exclude()
    friends: any[];

    setting: UserSetting;

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
}
