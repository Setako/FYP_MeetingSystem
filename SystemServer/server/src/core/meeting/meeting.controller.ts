import { Auth } from '@commander/shared/decorator/auth.decorator';
import { MeetingGuard } from '@commander/shared/guard/meeting.guard';
import { FilterNotObjectIdStringPipe } from '@commander/shared/pipe/filter-not-object-id-string.pipe';
import { SplitSemicolonPipe } from '@commander/shared/pipe/split-semicolon.pipe';
import { NumberUtils } from '@commander/shared/utils/number.utils';
import { ObjectUtils } from '@commander/shared/utils/object.utils';
import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
    UseGuards,
    BadRequestException,
    HttpStatus,
    HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../user/user.model';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { EditMeetingDto } from './dto/edit-meeting.dto';
import { MeetingQueryDto } from './dto/meeting-query.dto';
import { GetMeetingDto } from './dto/get-meeting.dto';
import { InvitationsDto } from './dto/invitations.dto';
import { MeetingService } from './meeting.service';
import { defer, identity, from, combineLatest, pipe, zip } from 'rxjs';
import {
    flatMap,
    filter,
    map,
    toArray,
    mapTo,
    switchMap,
    tap,
    mergeMapTo,
    groupBy,
    reduce,
} from 'rxjs/operators';
import { InstanceType } from 'typegoose';
import { GetInvitationDto } from './dto/get-invitation.dto';
import { MeetingOwnerGuard } from '@commander/shared/guard/meeting-owner.guard';
import { Types } from 'mongoose';
import { InvitationStatus, MeetingStatus, Meeting } from './meeting.model';
import { AcceptDto } from '@commander/shared/dto/accept.dto';
import { EditMeetingStatusDto } from './dto/edit-meeting.status.dto';
import { ValidationPipe } from '@commander/shared/pipe/validation.pipe';
import { ReadyToPlannedMeetingDto } from './dto/ready-to-planned-meeting.dto';
import { NotificationService } from '../notification/notification.service';
import {
    NotificationType,
    NotificationObjectModel,
} from '../notification/notification.model';
import { UserService } from '../user/user.service';
import { MeetingBusyTimeQueryDto } from './dto/meeting-busy-time-query.dto';
import { GoogleAuthService } from '../google/google-auth.service';
import { GoogleEventService } from '../google/google-event.service';
import { GoogleCalendarService } from '../google/google-calendar.service';
import { BusyTimeDto } from './dto/busy-time.dto';

@Controller('meeting')
@UseGuards(AuthGuard('jwt'))
export class MeetingController {
    constructor(
        private readonly meetingService: MeetingService,
        private readonly userService: UserService,
        private readonly notificationService: NotificationService,
        private readonly googleAuthService: GoogleAuthService,
        private readonly googleEventService: GoogleEventService,
        private readonly googleCalendarService: GoogleCalendarService,
    ) {}

    @Get()
    async getAll(
        @Query() query: MeetingQueryDto,
        @Auth() user: InstanceType<User>,
    ) {
        const options = await this.meetingService.getQueryOption(
            query,
            user.id,
        );

        const list = defer(() =>
            query.resultPageSize
                ? this.meetingService.getAllWithPage(
                      NumberUtils.parseOrThrow(query.resultPageSize),
                      NumberUtils.parseOr(query.resultPageNum, 1),
                      options,
                  )
                : this.meetingService.getAll(options),
        ).pipe(
            flatMap(identity),
            filter(item => Boolean(item)),
            flatMap(item =>
                item.populate('owner invitations.user').execPopulate(),
            ),
        );

        const items = list.pipe(
            map(item => ObjectUtils.DocumentToPlain(item, GetMeetingDto)),
        );

        const length = from(this.meetingService.countDocuments(options));

        return combineLatest(items.pipe(toArray()), length).pipe(
            map(([itemList, totalLength]) => ({
                items: itemList,
                length: totalLength,
                resultPageNum: NumberUtils.parseOr(query.resultPageNum, 1),
            })),
        );
    }

    @Get(':ids')
    async get(
        @Auth() user: InstanceType<User>,
        @Param(
            'ids',
            new SplitSemicolonPipe(),
            new FilterNotObjectIdStringPipe(),
        )
        ids: string[],
        @Query() query,
    ) {
        const { resultPageNum = 1, resultPageSize } = query;

        ids = await from(ids)
            .pipe(
                switchMap(id =>
                    from(
                        this.meetingService.hasViewPermission(id, user.id),
                    ).pipe(
                        filter(Boolean),
                        mapTo(id),
                    ),
                ),
                toArray(),
            )
            .toPromise();

        const list = defer(() =>
            resultPageSize
                ? this.meetingService.getByIdsWithPage(
                      ids,
                      NumberUtils.parseOrThrow(resultPageSize),
                      NumberUtils.parseOrThrow(resultPageNum),
                  )
                : this.meetingService.getByIds(ids),
        ).pipe(
            flatMap(identity),
            flatMap(item =>
                item.populate('owner invitations.user').execPopulate(),
            ),
        );

        const items = list.pipe(
            map(item => ObjectUtils.DocumentToPlain(item, GetMeetingDto)),
        );

        const length = from(this.meetingService.countDocumentsByIds(ids));

        return combineLatest(items.pipe(toArray()), length).pipe(
            map(([itemList, totalLength]) => ({
                items: itemList,
                length: totalLength,
                resultPageNum: NumberUtils.parseOr(query.resultPageNum, 1),
            })),
        );
    }

    @Post()
    async create(@Auth() owner: User, @Body() meeting: CreateMeetingDto) {
        return from(this.meetingService.create(meeting, owner)).pipe(
            flatMap(item =>
                item.populate('owner invitations.user').execPopulate(),
            ),
            map(item => ObjectUtils.DocumentToPlain(item, GetMeetingDto)),
        );
    }

    @Put(':id')
    @UseGuards(MeetingOwnerGuard)
    @UseGuards(MeetingGuard)
    async edit(
        @Param('id') id: string,
        @Body() editMeetingDto: EditMeetingDto,
    ) {
        const sendNotification$ = from(this.meetingService.getById(id))
            .pipe(
                filter(
                    item =>
                        Boolean(item) &&
                        [
                            MeetingStatus.Planned,
                            MeetingStatus.Confirmed,
                            MeetingStatus,
                        ].includes(item.status),
                ),
            )
            .pipe(
                mergeMapTo(
                    this.meetingService.findNewInviteeIds(
                        id,
                        editMeetingDto.invitations,
                    ),
                ),
                flatMap(identity),
            )
            .pipe(
                filter(inviteeId => Boolean(inviteeId)),
                flatMap(inviteeId =>
                    this.notificationService.create({
                        receiver: Types.ObjectId(inviteeId),
                        type: NotificationType.MeetingInviteReceived,
                        time: new Date(),
                        object: Types.ObjectId(id),
                        objectModel: NotificationObjectModel.Meeting,
                    }),
                ),
            );

        return from(this.meetingService.edit(id, editMeetingDto)).pipe(
            map(item => item!._id),
            flatMap(_id =>
                this.meetingService
                    .findAll({ _id: { $eq: _id } })
                    .populate('owner invitations.user')
                    .exec(),
            ),
            flatMap(identity),
            map(item => ObjectUtils.DocumentToPlain(item, GetMeetingDto)),
            tap(() => sendNotification$.subscribe()),
        );
    }

    @Put(':id/status')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(MeetingOwnerGuard)
    @UseGuards(MeetingGuard)
    async editStatus(
        @Param('id') id: string,
        @Body() { status }: EditMeetingStatusDto,
    ) {
        const meeting = await this.meetingService.getById(id);

        const allowStatusTo = new Map([
            [
                MeetingStatus.Draft,
                [
                    MeetingStatus.Planned,
                    MeetingStatus.Cancelled,
                    MeetingStatus.Deleted,
                ],
            ],
            [
                MeetingStatus.Planned,
                [
                    MeetingStatus.Confirmed,
                    MeetingStatus.Cancelled,
                    MeetingStatus.Deleted,
                ],
            ],
            [
                MeetingStatus.Confirmed,
                [
                    MeetingStatus.Planned,
                    MeetingStatus.Cancelled,
                    MeetingStatus.Deleted,
                ],
            ],
            [MeetingStatus.Started, [MeetingStatus.Ended]],
            [MeetingStatus.Ended, [MeetingStatus.Started]],
            [MeetingStatus.Cancelled, []],
            [MeetingStatus.Deleted, []],
        ]);

        if (!allowStatusTo.get(meeting.status).includes(status)) {
            throw new BadRequestException(
                `The ${
                    meeting.status
                } meeting are not allowed to be updated as ${status}`,
            );
        }

        const checkIsMeetingValidate = async (
            meetingInstance: InstanceType<Meeting>,
            editedStatus: MeetingStatus,
        ) => {
            switch (editedStatus) {
                case MeetingStatus.Planned:
                    await new ValidationPipe({
                        transform: true,
                    }).transformDocument(
                        meetingInstance,
                        ReadyToPlannedMeetingDto,
                    );
            }
        };

        await checkIsMeetingValidate(meeting, status);
        await this.meetingService.editStatus(id, status);

        const afterUpdateAction = new Map([
            [
                MeetingStatus.Planned,
                (meetingInstance: InstanceType<Meeting>) => {
                    const inviteeInWaiting = meetingInstance.invitations.filter(
                        item =>
                            item.status === InvitationStatus.Waiting &&
                            item.user,
                    );

                    return from(inviteeInWaiting).pipe(
                        flatMap(invitee =>
                            this.notificationService.create({
                                receiver: invitee.user as Types.ObjectId,
                                type: NotificationType.MeetingInviteReceived,
                                time: new Date(),
                                object: meetingInstance._id,
                                objectModel: NotificationObjectModel.Meeting,
                            }),
                        ),
                    );
                },
            ],
        ]);

        if (afterUpdateAction.has(status)) {
            afterUpdateAction
                .get(status)(meeting)
                .subscribe();
        }
    }

    @Delete(':id')
    @UseGuards(MeetingOwnerGuard)
    @UseGuards(MeetingGuard)
    async delete(@Param('id') id: string) {
        await this.meetingService.delete(id);
    }

    @Put(':id/invitation')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(MeetingOwnerGuard)
    @UseGuards(MeetingGuard)
    async acceptOrRejctInvitation(
        @Auth() user: InstanceType<User>,
        @Param('id') id: string,
        @Body() acceptDto: AcceptDto,
    ) {
        const isInvited$ = from(
            this.meetingService.countDocuments({
                $and: [
                    { _id: { $eq: Types.ObjectId(id) } },
                    {
                        'invitations.user': {
                            $eq: Types.ObjectId(user.id),
                        },
                    },
                    {
                        'invitations.status': {
                            $in: [InvitationStatus.Waiting],
                        },
                    },
                ],
            }),
        ).pipe(
            tap(item => {
                if (item === 0) {
                    throw new BadRequestException(
                        'You have not been invited to this meeting or have accepted or rejected this invitation.',
                    );
                }
            }),
        );

        await isInvited$
            .pipe(
                flatMap(() =>
                    this.meetingService.acceptOrRejectInvitation(
                        id,
                        user.id,
                        acceptDto.accept,
                    ),
                ),
            )
            .toPromise();
    }

    @Get(':id/busy-time')
    @UseGuards(MeetingOwnerGuard)
    @UseGuards(MeetingGuard)
    async getBusyTime(
        @Auth() user: InstanceType<User>,
        @Param('id') id: string,
        @Query() query: MeetingBusyTimeQueryDto,
    ) {
        // this.meetingService.getAllUserJoinedMeetingInRange(user.id)

        const friendsId$ = from(
            this.meetingService.getAllFriendIdsInInvitations(id, user.id),
        ).pipe(
            map(list => [...new Set(list).add(user.id)]),
            flatMap(identity),
        );

        const friend$ = friendsId$.pipe(
            flatMap(friendId => this.userService.getById(friendId)),
            filter(item => Boolean(item)),
        );

        const whoHasGoogleService$ = friend$.pipe(
            filter(({ googleRefreshToken }) => Boolean(googleRefreshToken)),
            flatMap(friend =>
                from(
                    this.googleAuthService.isRefreshTokenAvailable(
                        friend.googleRefreshToken,
                    ),
                ).pipe(
                    filter(identity),
                    mapTo(friend),
                ),
            ),
        );

        const userRefreshToken$ = whoHasGoogleService$.pipe(
            map(friend => friend.googleRefreshToken),
        );

        const userCalendarIdList$ = userRefreshToken$.pipe(
            flatMap(token => this.googleCalendarService.getAllCalendars(token)),
            map(calendar => calendar.id),
            toArray(),
        );

        const userBusyEventCalendar$ = zip(
            userRefreshToken$,
            userCalendarIdList$,
        ).pipe(
            flatMap(([refreshToken, calendarIds]) =>
                this.googleEventService.getAllBusyEvent({
                    refreshToken,
                    calendarIds,
                    timeMax: query.toDate,
                    timeMin: query.fromDate,
                }),
            ),
            toArray(),
        );

        const busyTime$ = zip(
            whoHasGoogleService$,
            userBusyEventCalendar$,
        ).pipe(
            flatMap(([userInstance, eventCalendar]) =>
                from(eventCalendar).pipe(
                    flatMap(item => Object.values(item)),
                    filter(item => !item.errors),
                    flatMap(item => item.busy),
                    map(({ start, end }) => ({
                        fromDate: new Date(start),
                        toDate: new Date(end),
                        user: userInstance,
                    })),
                ),
            ),
        );

        const groupedBusyTime$ = busyTime$.pipe(
            groupBy(time => time.fromDate.getTime() - time.toDate.getTime()),
            flatMap(group => group.pipe(toArray())),
        );

        const result$ = groupedBusyTime$.pipe(
            map(group => ({
                fromDate: group.length !== 0 ? group[0].fromDate : undefined,
                toDate: group.length !== 0 ? group[0].toDate : undefined,
                users: group.reduce(
                    (acc, xs) => acc.concat(xs.user),
                    [] as Array<InstanceType<User>>,
                ),
            })),
            filter(item => Boolean(item.fromDate) && Boolean(item.toDate)),
        );

        return result$.pipe(
            map(item => ObjectUtils.ObjectToPlain(item, BusyTimeDto)),
            toArray(),
            map(items => ({ items })),
        );
    }

    @Get(':id/participant')
    @UseGuards(MeetingGuard)
    async getInvitation(@Param('id') id: string) {
        return from(this.meetingService.getById(id)).pipe(
            flatMap(item => item!.populate('invitations.user').execPopulate()),
            map(
                pipe(
                    item => item.toObject(),
                    ({ invitations }) => ({
                        items: invitations.map((item: object) =>
                            ObjectUtils.ObjectToPlain(item, GetInvitationDto),
                        ),
                        length: invitations.length,
                    }),
                ),
            ),
        );
    }

    @Put(':id/participant')
    @UseGuards(MeetingOwnerGuard)
    @UseGuards(MeetingGuard)
    async editInvitation(
        @Param('id') id: string,
        @Body() invitationDto: InvitationsDto,
    ) {
        return from(
            this.meetingService.editInvitations(id, invitationDto),
        ).pipe(
            flatMap(item => item!.populate('invitations.user').execPopulate()),
            map(
                pipe(
                    item => item.toObject(),
                    ({ invitations }) => ({
                        items: invitations.map((item: object) =>
                            ObjectUtils.ObjectToPlain(item, GetInvitationDto),
                        ),
                        length: invitations.length,
                    }),
                ),
            ),
        );
    }

    @Put(':id/calendar')
    @UseGuards(MeetingGuard)
    async markOrUnMarkCalendar() {
        // Todo: mark the calendar
    }
}
