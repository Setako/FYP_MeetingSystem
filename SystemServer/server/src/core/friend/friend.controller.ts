import { Auth } from '@commander/shared/decorator/auth.decorator';
import { UserGuard } from '@commander/shared/guard/user.guard';
import { SplitSemicolonPipe } from '@commander/shared/pipe/split-semicolon.pipe';
import { NumberUtils } from '@commander/shared/utils/number.utils';
import {
    Controller,
    Delete,
    Get,
    NotFoundException,
    Param,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { classToPlain } from 'class-transformer';
import { Types } from 'mongoose';
import { InstanceType } from 'typegoose';
import { User } from '../user/user.model';
import { UserService } from '../user/user.service';
import { GetFriendDto } from './dto/get-friend.dto';
import { FriendService } from './friend.service';
import {
    from,
    identity,
    defer,
    combineLatest,
    pipe,
    empty,
    throwError,
} from 'rxjs';
import { flatMap, map, toArray, filter } from 'rxjs/operators';
import { PaginationQueryDto } from '@commander/shared/dto/pagination-query.dto';
import { ObjectUtils } from '@commander/shared/utils/object.utils';

@Controller('friend')
@UseGuards(AuthGuard('jwt'))
export class FriendController {
    constructor(
        private readonly friendService: FriendService,
        private readonly userService: UserService,
    ) {}

    @Get()
    async getAll(
        @Auth() user: InstanceType<User>,
        @Query() query: PaginationQueryDto,
    ) {
        const length = from(this.friendService.countDocumentsByUserId(user.id));

        const list = defer(() =>
            query.resultPageSize
                ? this.friendService.getAllByUserIdWithPage(
                      user.id,
                      NumberUtils.parseOrThrow(query.resultPageSize),
                      NumberUtils.parseOr(query.resultPageNum, 1),
                  )
                : this.friendService.getAllByUserId(user.id),
        ).pipe(
            flatMap(identity),
            flatMap(item => item.populate('friends').execPopulate()),
        );

        const items = list.pipe(
            map(item => ({
                user: item.friends.filter(
                    (friend: InstanceType<User>) =>
                        !Types.ObjectId(friend.id).equals(user.id),
                )[0],
                addDate: item.addDate,
                stared: item.stared.some((id: Types.ObjectId) =>
                    id.equals(user.id),
                ),
            })),
        );

        return combineLatest(
            items.pipe(
                map(item => ObjectUtils.ObjectToPlain(item, GetFriendDto)),
                toArray(),
            ),
            length,
        ).pipe(
            map(([itemList, totalLength]) => ({
                items: itemList,
                length: totalLength,
                resultPageNum: NumberUtils.parseOr(query.resultPageNum, 1),
            })),
        );
    }

    @Get(':usernames')
    async getAllByUsernames(
        @Auth() user: InstanceType<User>,
        @Param('usernames', new SplitSemicolonPipe()) usernames: string[],
    ) {
        const users = from(
            this.userService.getByUsernames(
                usernames.filter(username => username !== user.username),
            ),
        ).pipe(
            flatMap(identity),
            filter(item => Boolean(item)),
        );

        const friends = users.pipe(
            flatMap(
                pipe(
                    item => this.friendService.getByFriends(user.id, item.id),
                    item => from(item),
                ),
            ),
            filter(item => Boolean(item)),
            flatMap(item => item.populate('friends').execPopulate()),
        );

        const items = friends.pipe(
            map(
                pipe(
                    item => ({
                        user: item.friends.filter(
                            (friend: InstanceType<User>) =>
                                !Types.ObjectId(friend.id).equals(user.id),
                        )[0],
                        addDate: item.addDate,
                        stared: item.stared.some((id: Types.ObjectId) =>
                            id.equals(user.id),
                        ),
                    }),
                    item => ObjectUtils.ObjectToPlain(item, GetFriendDto),
                ),
            ),
            toArray(),
        );

        return items.pipe(
            map(itemList => ({
                items: itemList,
                resultPageNum: 1,
                length: itemList.length,
            })),
        );
    }

    @Delete(':username')
    @UseGuards(UserGuard)
    async delete(
        @Auth() user: InstanceType<User>,
        @Param('username') friendUsername: string,
    ) {
        if (friendUsername === user.username) {
            throw new NotFoundException('Target user is not your friend');
        }

        const friend = await this.userService.getByUsername(friendUsername);
        const isFriend = await this.friendService.isFriends(user.id, friend.id);

        if (!isFriend) {
            throw new NotFoundException('Target user is not your friend');
        }

        await this.friendService.deleteByFirends(user.id, friend.id);
    }

    @Put(':username/stared')
    async staredOrUnstared(
        @Auth() user: InstanceType<User>,
        @Param('username') friendUsername: string,
    ) {
        if (friendUsername === user.username) {
            throw new NotFoundException('Target user is not your friend');
        }

        const friend = await this.userService.getByUsername(friendUsername);
        const isFriend = await this.friendService.isFriends(user.id, friend.id);

        if (!isFriend) {
            throw new NotFoundException('Target user is not your friend');
        }

        const result = await this.friendService.staredOrUnstared(
            user.id,
            friend.id,
        );

        return ObjectUtils.ObjectToPlain(
            {
                user: friend.toObject(),
                addDate: result.addDate,
                stared: result.stared.some((id: Types.ObjectId) =>
                    id.equals(user.id),
                ),
            },
            GetFriendDto,
        );
    }
}
