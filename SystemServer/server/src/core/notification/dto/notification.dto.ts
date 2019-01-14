import { Exclude, Expose } from 'class-transformer';
import { Types } from 'mongoose';
import { NotificationObjectModel } from '../notification.model';

@Exclude()
export class NotificationDto {
    @Expose()
    get id() {
        return this._id.toHexString();
    }

    @Expose()
    type!: string;

    @Expose()
    time!: Date;

    @Expose()
    object: any;

    _id!: Types.ObjectId;

    objectModel!: NotificationObjectModel;

    receiver!: Types.ObjectId;

    constructor(partial: Partial<NotificationDto>) {
        Object.assign(this, partial);
    }
}
