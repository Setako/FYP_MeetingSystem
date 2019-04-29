import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { FriendRequest, FriendRequestStatus } from './friend-request.model';
import { ModelType } from 'typegoose';
import { UserService } from '../user/user.service';
import { AcceptDto } from '../../shared/dto/accept.dto';
import { flatMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable()
export class FriendRequestService {
    constructor(
        @InjectModel(FriendRequest)
        private readonly friendRequestModel: typeof FriendRequest &
            ModelType<FriendRequest>,
        private readonly userService: UserService,
    ) {}

    getById(id: string) {
        return of(id).pipe(
            flatMap(() => this.friendRequestModel.findById(id).exec()),
        );
    }

    getByUserAndTarget(user: string, target: string, options = {}) {
        return of(options).pipe(
            flatMap(async conditions => ({
                ...conditions,
                user: await this.userService.getByUsername(user).toPromise(),
                targetUser: await this.userService
                    .getByUsername(target)
                    .toPromise(),
            })),
            flatMap(conditions =>
                this.friendRequestModel.findOne(conditions).exec(),
            ),
        );
    }

    async getAllByTarget(target: string, options = {}) {
        return this.friendRequestModel
            .find({
                ...options,
                targetUser: await this.userService
                    .getByUsername(target)
                    .toPromise(),
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
                targetUser: await this.userService
                    .getByUsername(target)
                    .toPromise(),
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
                targetUser: await this.userService
                    .getByUsername(target)
                    .toPromise(),
            })
            .countDocuments()
            .exec();
    }

    async countDocumentsByUser(username: string, options = {}) {
        const user = await this.userService.getByUsername(username).toPromise();
        return this.friendRequestModel
            .find({
                ...options,
                user,
            })
            .countDocuments()
            .exec();
    }

    async getAllByUser(username: string, options = {}) {
        const user = await this.userService.getByUsername(username).toPromise();
        return this.friendRequestModel
            .find({
                ...options,
                user: user._id,
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
        const user = await this.userService.getByUsername(username).toPromise();
        return this.friendRequestModel
            .find({
                ...options,
                user: user._id,
            })
            .populate('user')
            .populate('targetUser')
            .skip(pageSize * (pageNum - 1))
            .limit(pageSize)
            .exec();
    }

    async create(senderUsername: string, targetName: string) {
        const sender = await this.userService
            .getByUsername(senderUsername)
            .toPromise();
        const target = await this.userService
            .getByUsername(targetName)
            .toPromise();

        const created = new this.friendRequestModel({
            user: sender,
            targetUser: target,
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
            user: await this.userService.getByUsername(user).toPromise(),
            targetUser: await this.userService
                .getByUsername(target)
                .toPromise(),
        });
    }

    async acceptOrRejectRequest(
        user: string,
        target: string,
        acceptDto: AcceptDto,
    ) {
        const request = await this.getByUserAndTarget(user, target, {
            status: FriendRequestStatus.Requested,
        }).toPromise();

        if (!request) {
            return null;
        }

        request.status = acceptDto.accept
            ? FriendRequestStatus.Accepted
            : FriendRequestStatus.Rejected;

        return request.save();
    }

    async hasReqeustedRequest(user: string, target: string) {
        return this.friendRequestModel
            .find({
                user: await this.userService.getByUsername(user).toPromise(),
                targetUser: await this.userService
                    .getByUsername(target)
                    .toPromise(),
                status: FriendRequestStatus.Requested,
            })
            .countDocuments()
            .exec()
            .then(item => item !== 0);
    }
}
