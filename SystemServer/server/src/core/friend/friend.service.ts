import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType } from 'typegoose';
import { UserService } from '../user/user.service';
import { Friend } from './friend.model';

@Injectable()
export class FriendService {
    constructor(
        @InjectModel(Friend)
        private readonly friendModel: ModelType<Friend>,
        private readonly userService: UserService,
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
            .populate('friends')
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
            .populate('friends')
            .exec();
    }

    async getByFriends(userId: string, friendId: string) {
        return this.friendModel
            .findOne({
                friends: {
                    $all: [userId, friendId],
                },
            })
            .populate('friends')
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
        const user = await this.userService.getById(userId);
        const friend = await this.userService.getById(friendId);

        const created = new this.friendModel({
            friends: [user._id, friend._id],
            addDate,
        });

        created.stared = [];

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

        const isStared = result.stared.some((item: Types.ObjectId) =>
            item.equals(userId),
        );

        if (isStared) {
            result.stared = result.stared.filter(
                (item: Types.ObjectId) => !item.equals(userId),
            );
        } else {
            result.stared = [...result.stared, Types.ObjectId(userId)];
        }

        return result.save();
    }
}
