import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType } from 'typegoose';
import {
    Notification,
    NotificationObjectModel,
    NotificationType,
} from './notification.model';

@Injectable()
export class NotificationService {
    constructor(
        @InjectModel(Notification)
        private readonly notificationModuel: typeof Notification &
            ModelType<Notification>,
    ) {}

    async getById(id: string) {
        return this.notificationModuel.findById(id).exec();
    }

    async getAllByReceiverId(receiverId: string, options = {}) {
        return this.notificationModuel
            .find({
                ...options,
                receiver: receiverId,
            })
            .exec();
    }

    async getAllByReceiverIdWithPage(
        receiverId: string,
        pageSize: number,
        pageNum = 1,
        options = {},
    ) {
        return this.notificationModuel
            .find({
                ...options,
                receiver: receiverId,
            })
            .skip(pageSize * (pageNum - 1))
            .limit(pageSize)
            .exec();
    }

    async countDocumentsByReceiverId(receiverId: string, options = {}) {
        return this.notificationModuel
            .find({
                ...options,
                receiver: receiverId,
            })
            .countDocuments()
            .exec();
    }

    async create(createDto: {
        type: NotificationType;
        time: Date;
        receiver: Types.ObjectId;
        object: Types.ObjectId;
        objectModel: NotificationObjectModel;
    }) {
        const created = new this.notificationModuel({
            ...createDto,
        });

        return created.save();
    }

    async delete(id: string) {
        return this.notificationModuel.findByIdAndDelete(id);
    }

    async deleteAllByReceiverId(receiverId: string, options = {}) {
        return this.notificationModuel.deleteMany({
            ...options,
            receiver: receiverId,
        });
    }
}
