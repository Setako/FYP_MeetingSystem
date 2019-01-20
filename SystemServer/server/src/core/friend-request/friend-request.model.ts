import { prop, Ref, Typegoose } from 'typegoose';
import { User } from '../user/user.model';

export enum FriendRequestStatus {
    Accepted = 'accepted',
    Rejected = 'rejected',
    Requested = 'requested',
}

export class FriendRequest extends Typegoose {
    @prop({
        ref: User,
        required: true,
        index: true,
    })
    public user!: Ref<User>;

    @prop({
        ref: User,
        required: true,
    })
    public targetUser!: Ref<User>;

    @prop({
        required: true,
    })
    public requestTime!: Date;

    @prop({
        required: true,
        default: FriendRequestStatus.Requested,
        enum: FriendRequestStatus,
    })
    public status!: FriendRequestStatus;
}
