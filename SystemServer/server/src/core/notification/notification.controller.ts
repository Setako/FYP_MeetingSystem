import { Auth } from '@commander/shared/decorator/auth.decorator';
import { NotificationGuard } from '@commander/shared/guard/notification.guard';
import { NumberUtils } from '@commander/shared/utils/number.utils';
import {
    Controller,
    Delete,
    forwardRef,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { classToPlain } from 'class-transformer';
import { Types } from 'mongoose';
import { InstanceType } from 'typegoose';
import { GetFriendRequestDto } from '../friend-request/dto/get-friend-request.dto';
import { FriendRequestService } from '../friend-request/friend-request.service';
import { GetFirendQueryDto } from '../friend/dto/get-friend-query.dto';
import { User } from '../user/user.model';
import { NotificationObjectModel } from './notification.model';
import { NotificationService } from './notification.service';
import {
    defer,
    identity,
    from,
    pipe,
    zip,
    Observable,
    combineLatest,
    of,
} from 'rxjs';
import { flatMap, map, filter, toArray, switchMap } from 'rxjs/operators';

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

        const entityToPlain = (
            type: NotificationObjectModel,
            object: any,
        ): Observable<object> => {
            const types = {
                [NotificationObjectModel.FriendRequest]: (
                    obj: Types.ObjectId,
                ) => {
                    return from(
                        this.friendRequestService.getById(obj.toHexString()),
                    ).pipe(
                        filter(item => Boolean(item)),
                        map(
                            pipe(
                                item => item.toObject(),
                                item => new GetFriendRequestDto(item),
                                item => classToPlain(item),
                            ),
                        ),
                    );
                },
            };

            return types[type] ? types[type](object) : null;
        };

        const items = list.pipe(
            flatMap(
                pipe(
                    async item => ({
                        ...item.toObject(),
                        object: await entityToPlain(
                            item.objectModel,
                            item.object,
                        ).toPromise(),
                    }),
                    item => from(item),
                ),
            ),
            filter(item => Boolean(item.object)),
            map(({ id, type, time, object }) => ({
                id,
                type,
                time,
                object,
            })),
            toArray(),
        );

        return combineLatest(items, length).pipe(
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
