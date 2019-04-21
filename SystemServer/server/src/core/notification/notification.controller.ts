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
    Inject,
    forwardRef,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { combineLatest } from 'rxjs';
import { filter, flatMap, map, toArray } from 'rxjs/operators';
import { InstanceType } from 'typegoose';
import { User } from '../user/user.model';
import { NotificationDto } from './dto/notification.dto';
import { NotificationObjectModel } from './notification.model';
import { NotificationService } from './notification.service';
import { documentToPlain } from '@commander/shared/operator/document';
import { Meeting } from '../meeting/meeting.model';
import { MeetingService } from '../meeting/meeting.service';

@Controller('notification')
@UseGuards(AuthGuard('jwt'))
export class NotificationController {
    constructor(
        private readonly notificationService: NotificationService,
        @Inject(forwardRef(() => MeetingService))
        private readonly meetingService: MeetingService,
    ) {}

    @Get()
    getAll(
        @Auth() user: InstanceType<User>,
        @Query() query: PaginationQueryDto,
    ) {
        const notification$ = query.resultPageSize
            ? this.notificationService.getAllByReceiverIdWithPage(
                  user.id,
                  NumberUtils.parseOrThrow(query.resultPageSize),
                  NumberUtils.parseOr(query.resultPageNum, 1),
              )
            : this.notificationService.getAllByReceiverId(user.id);

        const length = this.notificationService.countDocumentsByReceiverId(
            user.id,
        );

        const populated$ = notification$.pipe(
            flatMap(item => {
                return item
                    .populate({
                        path: 'object',
                        populate: {
                            path:
                                item.objectModel ===
                                NotificationObjectModel.FriendRequest
                                    ? 'user targetUser'
                                    : 'owner invitations.user attendance.user resources.user.sharer',
                        },
                    })
                    .execPopulate();
            }),
            flatMap(async item => {
                if (item.objectModel === NotificationObjectModel.Meeting) {
                    const meeting = (item.object as unknown) as InstanceType<
                        Meeting
                    >;
                    meeting.resources = await this.meetingService.getAccessableResources(
                        meeting.id,
                        user.id,
                    );
                }

                return item;
            }),
        );

        const items$ = populated$.pipe(
            filter(item => Boolean(item.object)),
            documentToPlain(NotificationDto),
            toArray(),
            map(items =>
                items.sort((a, b) => b.time.getTime() - a.time.getTime()),
            ),
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
