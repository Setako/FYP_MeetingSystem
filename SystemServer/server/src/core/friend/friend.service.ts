import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType } from 'typegoose';
import { Friend } from './friend.model';

@Injectable()
export class FriendService {
    constructor(
        @InjectModel(Friend)
        private readonly friendModel: ModelType<Friend>,
    ) {}

    findAll(options = {}) {
        return this.friendModel.find(options);
    }

    async countDocumentsByUserId(userId: string, options = {}) {
        return this.friendModel
            .find({
                ...options,
                friends: userId,
            })
            .countDocuments()
            .exec();
    }

    async getAllByUserId(userId: string, options = {}) {
        return this.friendModel
            .find({
                ...options,
                friends: userId,
            })
            .exec();
    }

    async getAllByUserIdWithPage(
        userId: string,
        pageSize: number,
        pageNum = 1,
        options = {},
    ) {
        return this.friendModel
            .find({
                ...options,
                friends: userId,
            })
            .skip(pageSize * (pageNum - 1))
            .limit(pageSize)
            .exec();
    }

    async getByFriends(userId: string, friendId: string) {
        return this.friendModel
            .findOne({
                friends: {
                    $all: [userId, friendId],
                },
            })
            .exec();
    }

    async isFriends(userId: string, friendId: string) {
        return (
            (await this.friendModel
                .find({
                    friends: {
                        $all: [userId, friendId],
                    },
                })
                .exec()).length !== 0
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
