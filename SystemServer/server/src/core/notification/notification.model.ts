import { Typegoose, prop, Ref } from 'typegoose';
import { User } from '../user/user.model';
import { Types } from 'mongoose';

export enum NotificationType {
    FriendRequestReceived = 'friendRequestReceived',
    FriendRequestAccepted = 'friendRequestAccepted',
    FriendRequestRejected = 'friendRequestRejected',
}

export enum NotificationObjectModel {
    FriendRequest = 'FriendRequest',
}

export class Notification extends Typegoose {
    @prop({
        required: true,
        enum: NotificationType,
    })
    public type: NotificationType;

    @prop({
        required: true,
    })
    public time: Date;

    @prop({
        required: true,
        ref: User,
        index: true,
    })
    public receiver: Ref<User>;

    @prop({
        refPath: 'objectModel',
    } as any)
    public object: Types.ObjectId;

    @prop({
        required: true,
        enum: NotificationObjectModel,
    })
    public objectModel: NotificationObjectModel;
}
