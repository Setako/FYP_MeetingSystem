import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType } from 'typegoose';
import {
    Notification,
    NotificationObjectModel,
    NotificationType,
} from './notification.model';
import { of, identity } from 'rxjs';
import { flatMap } from 'rxjs/operators';

@Injectable()
export class NotificationService {
    constructor(
        @InjectModel(Notification)
        private readonly notificationModuel: typeof Notification &
            ModelType<Notification>,
    ) {}

    getById(id: string) {
        return of(id).pipe(
            flatMap(notificationId =>
                this.notificationModuel.findById(notificationId).exec(),
            ),
        );
    }

    getAllByReceiverId(receiverId: string, options = {}) {
        return of({ ...options, receiver: receiverId }).pipe(
            flatMap(conditions =>
                this.notificationModuel.find(conditions).exec(),
            ),
            flatMap(identity),
        );
    }

    getAllByReceiverIdWithPage(
        receiverId: string,
        pageSize: number,
        pageNum = 1,
        options = {},
    ) {
        return of({ ...options, receiver: receiverId }).pipe(
            flatMap(conditions =>
                this.notificationModuel
                    .find(conditions)
                    .skip(pageSize * (pageNum - 1))
                    .limit(pageSize)
                    .exec(),
            ),
            flatMap(identity),
        );
    }

    countDocuments(options = {}) {
        return of(options).pipe(
            flatMap(conditions =>
                this.notificationModuel
                    .find(conditions)
                    .countDocuments()
                    .exec(),
            ),
        );
    }

    countDocumentsByReceiverId(receiverId: string, options = {}) {
        return of({ ...options, receiver: receiverId }).pipe(
            flatMap(conditions =>
                this.notificationModuel
                    .find(conditions)
                    .countDocuments()
                    .exec(),
            ),
        );
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
