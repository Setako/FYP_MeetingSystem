import { Auth } from '@commander/shared/decorator/auth.decorator';
import { UserGuard } from '@commander/shared/guard/user.guard';
import { NumberUtils } from '@commander/shared/utils/number.utils';
import { ObjectUtils } from '@commander/shared/utils/object.utils';
import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    forwardRef,
    Get,
    HttpCode,
    Inject,
    NotFoundException,
    Param,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Types } from 'mongoose';
import { InstanceType } from 'typegoose';
import { FriendService } from '../friend/friend.service';
import {
    NotificationObjectModel,
    NotificationType,
} from '../notification/notification.model';
import { NotificationService } from '../notification/notification.service';
import { User } from '../user/user.model';
import { UserService } from '../user/user.service';
import { AcceptDto } from '../../shared/dto/accept.dto';
import { GetFriendRequestDto } from './dto/get-friend-request.dto';
import { FriendRequestStatus, FriendRequest } from './friend-request.model';
import { FriendRequestService } from './friend-request.service';
import { PaginationQueryDto } from '@commander/shared/dto/pagination-query.dto';
import { defer, identity, from, combineLatest } from 'rxjs';
import { map, flatMap, toArray } from 'rxjs/operators';

@Controller('friend/request')
@UseGuards(AuthGuard('jwt'))
export class FriendRequestController {
    constructor(
        private readonly friendRequestService: FriendRequestService,
        private readonly userService: UserService,
        private readonly friendService: FriendService,
        @Inject(forwardRef(() => NotificationService))
        private readonly notificationService: NotificationService,
    ) {}

    @Get()
    async getAllSentRequests(
        @Auth() user: InstanceType<User>,
        @Query() query: PaginationQueryDto,
    ) {
        const { resultPageNum, resultPageSize } = query;

        const list = defer(() =>
            resultPageSize
                ? this.friendRequestService.getAllByUserWithPage(
                      user.username,
                      NumberUtils.parseOrThrow(resultPageSize),
                      NumberUtils.parseOr(resultPageNum, 1),
                  )
                : this.friendRequestService.getAllByUser(user.username),
        ).pipe(flatMap(identity));

        const items = list.pipe(
            map(item => ObjectUtils.DocumentToPlain(item, GetFriendRequestDto)),
        );

        const length = from(
            this.friendRequestService.countDocumentsByUser(user.username),
        );

        return combineLatest(items.pipe(toArray()), length).pipe(
            map(([itemList, totalLength]) => ({
                items: itemList,
                length: totalLength,
                resultPageNum: NumberUtils.parseOr(resultPageNum, 1),
            })),
        );
    }

    @Post(':username')
    @UseGuards(UserGuard)
    async sendRequest(
        @Auth() user: InstanceType<User>,
        @Param('username') username: string,
    ) {
        if (username === user.username) {
            throw new BadRequestException('You cannot add youself as friend');
        }

        const target = await this.userService.getByUsername(username);
        if (!target) {
            throw new NotFoundException('Target user not found');
        }

        if (await this.friendService.isFriends(user.id, target.id)) {
            throw new BadRequestException('Target user already is friend');
        }

        if (
            await this.friendRequestService.hasReqeustedRequest(
                user.username,
                username,
            )
        ) {
            throw new BadRequestException('Request already sent');
        }

        const created = await this.friendRequestService.create(
            user.username,
            username,
        );

        this.notificationService.create({
            receiver: created.targetUser as Types.ObjectId,
            type: NotificationType.FriendRequestReceived,
            time: new Date(),
            object: created._id,
            objectModel: NotificationObjectModel.FriendRequest,
        });

        return ObjectUtils.DocumentToPlain(created, GetFriendRequestDto);
    }

    @HttpCode(204)
    @Delete(':username')
    @UseGuards(UserGuard)
    async cancelRequest(
        @Auth() user: InstanceType<User>,
        @Param('username') target: string,
    ) {
        if (
            !(await this.friendRequestService.hasReqeustedRequest(
                user.username,
                target,
            ))
        ) {
            throw new NotFoundException('Not requests sent');
        }

        await this.friendRequestService.delete(user.username, target);
    }

    @Get('/received')
    async getAllReceivedRequests(
        @Auth() user: InstanceType<User>,
        @Query() query: PaginationQueryDto,
    ) {
        const { resultPageNum, resultPageSize } = query;

        const list = defer(() =>
            resultPageSize
                ? this.friendRequestService.getAllByTargetWithPage(
                      user.username,
                      NumberUtils.parseOrThrow(resultPageSize),
                      NumberUtils.parseOr(resultPageNum, 1),
                      {
                          status: FriendRequestStatus.Requested,
                      },
                  )
                : this.friendRequestService.getAllByTarget(user.username, {
                      status: FriendRequestStatus.Requested,
                  }),
        ).pipe(flatMap(identity));

        const items = list.pipe(
            map(item => ObjectUtils.DocumentToPlain(item, GetFriendRequestDto)),
        );

        const length = from(
            this.friendRequestService.countDocumentsByTarget(user.username),
        );

        return combineLatest(items.pipe(toArray()), length).pipe(
            map(([itemList, totalLength]) => ({
                items: itemList,
                length: totalLength,
                resultPageNum: NumberUtils.parseOr(resultPageNum, 1),
            })),
        );
    }

    @Put('/received/:username')
    @UseGuards(UserGuard)
    async acceptOrRejectRequest(
        @Auth() user: InstanceType<User>,
        @Param('username') source: string,
        @Body() acceptDto: AcceptDto,
    ) {
        const isRequestExist = await this.friendRequestService.hasReqeustedRequest(
            source,
            user.username,
        );

        if (!isRequestExist) {
            throw new NotFoundException('No requests sent');
        }

        const result = (await this.friendRequestService.acceptOrRejectRequest(
            source,
            user.username,
            acceptDto,
        )) as InstanceType<FriendRequest>;

        if (result.status === FriendRequestStatus.Accepted) {
            const friendship = await this.friendService.create(
                (result.user as InstanceType<User>).id,
                (result.targetUser as InstanceType<User>).id,
            );

            await this.friendRequestService.delete(user.username, source, {
                status: FriendRequestStatus.Requested,
            });
            await this.friendRequestService.delete(source, user.username, {
                status: FriendRequestStatus.Requested,
            });

            await this.notificationService.create({
                type: NotificationType.FriendRequestAccepted,
                time: friendship.addDate,
                object: result._id,
                objectModel: NotificationObjectModel.FriendRequest,
                receiver: result.user as Types.ObjectId,
            });
        } else if (result.status === FriendRequestStatus.Rejected) {
            await this.notificationService.create({
                type: NotificationType.FriendRequestRejected,
                time: new Date(),
                object: result._id,
                objectModel: NotificationObjectModel.FriendRequest,
                receiver: result.user as Types.ObjectId,
            });
        }
    }
}
