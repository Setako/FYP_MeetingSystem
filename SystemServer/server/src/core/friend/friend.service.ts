import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType } from 'typegoose';
import { Friend } from './friend.model';
import { of, identity } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';

@Injectable()
export class FriendService {
    constructor(
        @InjectModel(Friend)
        private readonly friendModel: ModelType<Friend>,
    ) {}

    findAll(options = {}) {
        return this.friendModel.find(options);
    }

    countDocumentsByUserId(userId: string, options = {}) {
        return of({ ...options, friends: userId }).pipe(
            flatMap(conditions =>
                this.friendModel
                    .find(conditions)
                    .countDocuments()
                    .exec(),
            ),
        );
    }

    getAllByUserId(userId: string, options = {}) {
        return of({ ...options, friends: userId }).pipe(
            flatMap(conditions => this.friendModel.find(conditions).exec()),
            flatMap(identity),
        );
    }

    getAllByUserIdWithPage(
        userId: string,
        pageSize: number,
        pageNum = 1,
        options = {},
    ) {
        return of({ ...options, friends: userId }).pipe(
            flatMap(conditions =>
                this.friendModel
                    .find(conditions)
                    .skip(pageSize * (pageNum - 1))
                    .limit(pageSize)
                    .exec(),
            ),
            flatMap(identity),
        );
    }

    getByFriends(userId: string, friendId: string) {
        return of({ friends: { $all: [userId, friendId] } }).pipe(
            flatMap(conditions => this.friendModel.findOne(conditions).exec()),
        );
    }

    isFriends(userId: string, friendId: string) {
        return of({ friends: { $all: [userId, friendId] } }).pipe(
            flatMap(conditions => this.friendModel.find(conditions).exec()),
            map(items => items.length !== 0),
        );
    }

    async create(userId: string, friendId: string, addDate = new Date()) {
        const created = new this.friendModel({
            friends: [Types.ObjectId(userId), Types.ObjectId(friendId)],
            addDate,
            stared: [],
        });

        return created.save();
    }

    async deleteByFirends(userId: string, friendId: string) {
        return this.friendModel.deleteMany({
            friends: {
                $all: [userId, friendId],
            },
        });
    }

    async deleteById(id: string) {
        return this.friendModel.findByIdAndDelete(id);
    }

    async staredOrUnstared(userId: string, friendId: string) {
        const result = await this.friendModel
            .findOne({
                friends: {
                    $all: [userId, friendId],
                },
            })
            .exec();

        if (!result) {
            return null;
        }

        const isStared = result.stared.some(item =>
            (item as Types.ObjectId).equals(userId),
        );

        result.stared = isStared
            ? result.stared.filter(
                  item => !(item as Types.ObjectId).equals(userId),
              )
            : [...result.stared, Types.ObjectId(userId)];

        return result.save();
    }
}
