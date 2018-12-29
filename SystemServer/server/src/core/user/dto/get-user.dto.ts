import { Exclude, Expose } from 'class-transformer';
import { Types } from 'mongoose';
import { UserSetting } from '../user.model';

export class GetUserDto {
    username: string;
    email: string;
    displayName: string;

    userMeetingRelation: [];

    @Exclude()
    friends: any[];

    setting: UserSetting;

    @Expose()
    get id(): string {
        return this._id.toHexString();
    }

    @Exclude()
    _id: Types.ObjectId;

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
