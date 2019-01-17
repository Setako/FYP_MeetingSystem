import { Exclude } from 'class-transformer';
import { Types } from 'mongoose';
import { UserSetting } from '../user.model';

export class UserDto {
    username!: string;
    email!: string;
    displayName!: string;

    userMeetingRelation!: any[];

    setting!: UserSetting;

    @Exclude()
    _id!: Types.ObjectId;

    @Exclude()
    password!: string;

    @Exclude()
    salt!: string;

    @Exclude()
    tokenVerificationCode!: string;

    @Exclude()
    googleRefreshToken?: string;

    @Exclude()
    __v!: number;

    @Exclude()
    avatar!: string;

    constructor(partial: Partial<UserDto>) {
        Object.assign(this, partial);
    }
}
