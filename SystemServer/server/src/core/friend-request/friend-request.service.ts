import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { FriendRequest, FriendRequestStatus } from './friend-request.model';
import { ModelType } from 'typegoose';
import { UserService } from '../user/user.service';
import { AcceptDto } from '../../shared/dto/accept.dto';

@Injectable()
export class FriendRequestService {
    constructor(
        @InjectModel(FriendRequest)
        private readonly friendRequestModel: typeof FriendRequest &
            ModelType<FriendRequest>,
        private readonly userService: UserService,
    ) {}

    async getById(id: string) {
        return this.friendRequestModel
            .findById(id)
            .populate('user')
            .populate('targetUser')
            .exec();
    }

    async getByUserAndTarget(user: string, target: string, options = {}) {
        return this.friendRequestModel
            .findOne({
                ...options,
                user: await this.userService.getByUsername(user),
                targetUser: await this.userService.getByUsername(target),
            })
            .populate('user')
            .populate('targetUser')
            .exec();
    }

    async getAllByTarget(target: string, options = {}) {
        return this.friendRequestModel
            .find({
                ...options,
                targetUser: await this.userService.getByUsername(target),
            })
            .populate('user')
            .populate('targetUser')
            .exec();
    }

    async getAllByTargetWithPage(
        target: string,
        pageSize: number,
        pageNum = 1,
        options = {},
    ) {
        return this.friendRequestModel
            .find({
                ...options,
                targetUser: await this.userService.getByUsername(target),
            })
            .populate('user')
            .populate('targetUser')
            .skip(pageSize * (pageNum - 1))
            .limit(pageSize)
            .exec();
    }

    async countDocumentsByTarget(target: string, options = {}) {
        return this.friendRequestModel
            .find({
                ...options,
                targetUser: await this.userService.getByUsername(target),
            })
            .countDocuments()
            .exec();
    }

    async countDocumentsByUser(username: string, options = {}) {
        const user = await this.userService.getByUsername(username);
        return this.friendRequestModel
            .find({
                ...options,
                user,
            })
            .countDocuments()
            .exec();
    }

    async getAllByUser(username: string, options = {}) {
        const user = await this.userService.getByUsername(username);
        return this.friendRequestModel
            .find({
                ...options,
                user,
            })
            .populate('user')
            .populate('targetUser')
            .exec();
    }

    async getAllByUserWithPage(
        username: string,
        pageSize: number,
        pageNum = 1,
        options = {},
    ) {
        const user = await this.userService.getByUsername(username);
        return this.friendRequestModel
            .find({
                ...options,
                user,
            })
            .populate('user')
            .populate('targetUser')
            .skip(pageSize * (pageNum - 1))
            .limit(pageSize)
            .exec();
    }

    async create(userStr: string, target: string) {
        const [user, targetUser] = await this.userService.getByUsernames([
            userStr,
            target,
        ]);

        const created = new this.friendRequestModel({
            user,
            targetUser,
            requestTime: new Date(),
            status: FriendRequestStatus.Requested,
        });

        return created.save();
    }

    async delete(
        user: string,
        target: string,
        options = { status: FriendRequestStatus.Requested },
    ) {
        return this.friendRequestModel.deleteMany({
            ...options,
            user: await this.userService.getByUsername(user),
            targetUser: await this.userService.getByUsername(target),
        });
    }

    async acceptOrRejectRequest(
        user: string,
        target: string,
        acceptDto: AcceptDto,
    ) {
        const request = await this.getByUserAndTarget(user, target, {
            status: FriendRequestStatus.Requested,
        });

        if (!request) { return null; }

        request.status = acceptDto.accept
            ? FriendRequestStatus.Accepted
            : FriendRequestStatus.Rejected;

        return request.save();
    }

    async hasReqeustedRequest(user: string, target: string) {
        return (
            (await this.friendRequestModel.find({
                user: await this.userService.getByUsername(user),
                targetUser: await this.userService.getByUsername(target),
                status: FriendRequestStatus.Requested,
            })).length !== 0
        );
    }
}
