import { Auth } from '@commander/shared/decorator/auth.decorator';
import { PaginationQueryDto } from '@commander/shared/dto/pagination-query.dto';
import { NotificationGuard } from '@commander/shared/guard/notification.guard';
import { NumberUtils } from '@commander/shared/utils/number.utils';
import {
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { combineLatest, defer, from, identity } from 'rxjs';
import { filter, flatMap, map, toArray } from 'rxjs/operators';
import { InstanceType } from 'typegoose';
import { User } from '../user/user.model';
import { NotificationDto } from './dto/notification.dto';
import { NotificationObjectModel } from './notification.model';
import { NotificationService } from './notification.service';
import { ObjectUtils } from '@commander/shared/utils/object.utils';

@Controller('notification')
@UseGuards(AuthGuard('jwt'))
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) {}

    @Get()
    async getAll(
        @Auth() user: InstanceType<User>,
        @Query() query: PaginationQueryDto,
    ) {
        const list = defer(() =>
            query.resultPageSize
                ? this.notificationService.getAllByReceiverIdWithPage(
                      user.id,
                      NumberUtils.parseOrThrow(query.resultPageSize),
                      NumberUtils.parseOr(query.resultPageNum, 1),
                  )
                : this.notificationService.getAllByReceiverId(user.id),
        ).pipe(flatMap(identity));

        const length = from(
            this.notificationService.countDocumentsByReceiverId(user.id),
        );

        const populated$ = list.pipe(
            flatMap(item => {
                return item
                    .populate({
                        path: 'object',
                        populate: {
                            path:
                                item.objectModel ===
                                NotificationObjectModel.FriendRequest
                                    ? 'user targetUser'
                                    : 'owner invitations.user',
                        },
                    })
                    .execPopulate();
            }),
        );

        const items$ = populated$.pipe(
            filter(item => Boolean(item.object)),
            map(item => ObjectUtils.DocumentToPlain(item, NotificationDto)),
            toArray(),
        );

        return combineLatest(items$, length).pipe(
            map(([itemList, totalLength]) => ({
                items: itemList,
                length: totalLength,
                resultPageNum: NumberUtils.parseOr(query.resultPageNum, 1),
            })),
        );
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
        await this.notificationService.delete(id);
    }
}
