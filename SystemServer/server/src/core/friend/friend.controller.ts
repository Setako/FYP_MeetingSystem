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
import { Auth } from '../../decorator/auth.decorator';
import { UserGuard } from '../../guard/user.guard';
import { SplitSemicolonPipe } from '../../pipe/split-semicolon.pipe';
import { NumberUtils } from '../../utils/number.utils';
import { User } from '../user/user.model';
import { UserService } from '../user/user.service';
import { GetFirendQueryDto } from './dto/get-friend-query.dto';
import { GetFriendDto } from './dto/get-friend.dto';
import { FriendService } from './friend.service';

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
        @Query() query: GetFirendQueryDto,
    ) {
        const list = query.resultPageSize
            ? await this.friendService.getAllByUserIdWithPage(
                  user.id,
                  NumberUtils.parseOrThrow(query.resultPageSize),
                  NumberUtils.parseOr(query.resultPageNum, 1),
              )
            : await this.friendService.getAllByUserId(user.id);

        const items = list.map(item => ({
            user: (item.friends.filter(
                (friend: InstanceType<User>) => friend.id !== user.id,
            )[0] as InstanceType<User>).toObject(),
            addDate: item.addDate,
            stared: Boolean(
                item.stared &&
                    item.stared.some(
                        (friend: InstanceType<User>) => friend.id === user.id,
                    ),
            ),
        }));

        const length = await this.friendService.countDocumentsByUserId(user.id);

        return {
            items: items.map(item =>
                classToPlain(new GetFriendDto(item as any)),
            ),
            resultPageNum: NumberUtils.parseOr(query.resultPageNum, 1),
            length,
        };
    }

    @Get(':usernames')
    async getAllByUsernames(
        @Auth() user: InstanceType<User>,
        @Param('usernames', new SplitSemicolonPipe()) usernames: string[],
    ) {
        const friends = await this.userService.getByUsernames(usernames);

        const list = await Promise.all(
            friends.filter(Boolean).map(async item => {
                return await this.friendService.getByFriends(user.id, item.id);
            }),
        );

        const items = list.filter(Boolean).map(item => ({
            user: (item.friends.filter(
                (friend: InstanceType<User>) => friend.id !== user.id,
            )[0] as InstanceType<User>).toObject(),
            addDate: item.addDate,
            stared: Boolean(
                item.stared &&
                    item.stared.some(
                        (friend: InstanceType<User>) => friend.id === user.id,
                    ),
            ),
        }));

        return {
            items: items.map(item =>
                classToPlain(new GetFriendDto(item as any)),
            ),
            resultPageNum: 1,
            length: items.length,
        };
    }

    @Delete(':username')
    @UseGuards(UserGuard)
    async delete(
        @Auth() user: InstanceType<User>,
        @Param('username') friendUsername: string,
    ) {
        const friend = await this.userService.getByUsername(friendUsername);

        if (!(await this.friendService.isFriends(user.id, friend.id))) {
            throw new NotFoundException('Target user is not your friend');
        }

        await this.friendService.deleteByFirends(user.id, friend.id);
    }

    @Put(':username/stared')
    async staredOrUnstared(
        @Auth() user: InstanceType<User>,
        @Param('username') friendUsername: string,
    ) {
        const friend = await this.userService.getByUsername(friendUsername);

        if (!(await this.friendService.isFriends(user.id, friend.id))) {
            throw new NotFoundException('Target user is not your friend');
        }

        const result = await this.friendService.staredOrUnstared(
            user.id,
            friend.id,
        );

        return classToPlain(
            new GetFriendDto({
                user: user.toObject(),
                addDate: result.addDate,
                stared: result.stared.some((item: Types.ObjectId) =>
                    item.equals(user.id),
                ),
            }),
        );
    }
}
