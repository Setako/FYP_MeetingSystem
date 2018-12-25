import {
    Controller,
    Get,
    UseGuards,
    Delete,
    Param,
    HttpCode,
    HttpStatus,
    Inject,
    forwardRef,
    Query,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../user/user.model';
import { Auth } from '../../decorator/auth.decorator';
import { InstanceType } from 'typegoose';
import { NotificationGuard } from '../../guard/notification.guard';
import { NotificationObjectModel } from './notification.model';
import { FriendRequestService } from '../friend-request/friend-request.service';
import { Types } from 'mongoose';
import { classToPlain } from 'class-transformer';
import { GetFriendRequestDto } from '../friend-request/dto/get-friend-request.dto';
import { GetFirendQueryDto } from '../friend/dto/get-friend-query.dto';
import { NumberUtils } from '../../utils/number.utils';

@Controller('notification')
@UseGuards(AuthGuard('jwt'))
export class NotificationController {
    constructor(
        private readonly notificationService: NotificationService,
        @Inject(forwardRef(() => FriendRequestService))
        private readonly friendRequestService: FriendRequestService,
    ) {}

    @Get()
    async getAll(
        @Auth() user: InstanceType<User>,
        @Query() query: GetFirendQueryDto,
    ) {
        const list = query.resultPageSize
            ? await this.notificationService.getAllByReceiverIdWithPage(
                  user.id,
                  NumberUtils.parseOrThrow(query.resultPageSize),
                  NumberUtils.parseOr(query.resultPageNum, 1),
              )
            : await this.notificationService.getAllByReceiverId(user.id);

        const length = await this.notificationService.countDocumentsByReceiverId(
            user.id,
        );

        const items = await Promise.all(
            list.map(async item => {
                let object: any = item.object;

                if (
                    item.objectModel === NotificationObjectModel.FriendRequest
                ) {
                    object = await this.friendRequestService.getById(
                        (item.object as Types.ObjectId).toHexString(),
                    );

                    object = classToPlain(
                        new GetFriendRequestDto(object.toObject()),
                    );
                }

                return {
                    type: item.type,
                    time: item.time,
                    // receiver: (await this.userService.getById(
                    //     (item.receiver as Types.ObjectId).toHexString(),
                    // )).username,
                    object,
                };
            }),
        );

        return {
            items,
            resultPageNum: NumberUtils.parseOr(query.resultPageNum, 1),
            length,
        };
    }

    @Delete()
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteAll(@Auth() user: InstanceType<User>) {
        await this.notificationService.deleteAllByReceiverId(user.id);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(NotificationGuard)
    async delete(@Param('id') id: string) {
        this.notificationService.delete(id);
    }
}
