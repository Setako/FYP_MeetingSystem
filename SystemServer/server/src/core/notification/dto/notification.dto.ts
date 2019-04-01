import { Exclude, Expose, Transform } from 'class-transformer';
import { Types } from 'mongoose';
import { NotificationObjectModel } from '../notification.model';
import { GetFriendRequestDto } from '@commander/core/friend-request/dto/get-friend-request.dto';
import { GetMeetingDto } from '@commander/core/meeting/dto/get-meeting.dto';
import { ObjectUtils } from '@commander/shared/utils/object.utils';

@Exclude()
export class NotificationDto {
    @Expose()
    @Transform((_val, obj) => obj._id.toHexString())
    id: string;

    @Expose()
    type!: string;

    @Expose()
    time!: Date;

    @Expose()
    @Transform((val, { objectModel, transformMap }) => {
        return transformMap.has(objectModel)
            ? ObjectUtils.ObjectToPlain(val, transformMap.get(objectModel))
            : val;
    })
    object: any;

    _id!: Types.ObjectId;

    objectModel!: NotificationObjectModel;

    receiver!: Types.ObjectId;

    transformMap: Map<NotificationObjectModel, new (...args: any[]) => any>;

    constructor(partial: Partial<NotificationDto>) {
        Object.assign(this, partial);
        this.transformMap = new Map<
            NotificationObjectModel,
            new (...args: any[]) => any
        >([
            [NotificationObjectModel.FriendRequest, GetFriendRequestDto],
            [NotificationObjectModel.Meeting, GetMeetingDto],
        ]);
    }
}
