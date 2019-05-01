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
    ForbiddenException,
    Inject,
    forwardRef,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../user/user.model';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { EditMeetingDto } from './dto/edit-meeting.dto';
import { MeetingQueryDto } from './dto/meeting-query.dto';
import { GetMeetingDto } from './dto/get-meeting.dto';
import { MeetingService } from './meeting.service';
import {
    defer,
    identity,
    from,
    combineLatest,
    zip,
    merge,
    empty,
    Observable,
    of,
    interval,
} from 'rxjs';
import {
    flatMap,
    filter,
    map,
    toArray,
    mapTo,
    tap,
    mergeAll,
    shareReplay,
    takeWhile,
    take,
    pluck,
    defaultIfEmpty,
    concatMap,
    catchError,
} from 'rxjs/operators';
import { InstanceType } from 'typegoose';
import { MeetingOwnerGuard } from '@commander/shared/guard/meeting-owner.guard';
import { Types } from 'mongoose';
import {
    InvitationStatus,
    MeetingStatus,
    Meeting,
    AttendanceStatus,
    Resources,
} from './meeting.model';
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
import { EditAttendeeStatusDto } from './dto/edit-attendee-status.dto';
import { MeetingSuggestTimeQuery } from './dto/meeting-suggest-time-query';
import { SuggestTimeDto } from './dto/suggest-time.dto';
import { PaginationQueryDto } from '@commander/shared/dto/pagination-query.dto';
import { UniqueArrayPipe } from '@commander/shared/pipe/unique-array.pipe';
import { skipFalsy } from '@commander/shared/operator/function';
import { populate, documentToPlain } from '@commander/shared/operator/document';
import { MeetingResourcesDto } from './dto/meeting-resouces.dto';
import { DateUtils } from '@commander/shared/utils/date.utils';

@Controller('meeting')
@UseGuards(AuthGuard('jwt'))
export class MeetingController {
    constructor(
        private readonly meetingService: MeetingService,
        private readonly userService: UserService,
        private readonly googleAuthService: GoogleAuthService,
        private readonly googleEventService: GoogleEventService,
        private readonly googleCalendarService: GoogleCalendarService,
        @Inject(forwardRef(() => NotificationService))
        private readonly notificationService: NotificationService,
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

        const meeting$ = query.resultPageSize
            ? this.meetingService.getAllWithPage(
                  NumberUtils.parseOrThrow(query.resultPageSize),
                  NumberUtils.parseOr(query.resultPageNum, 1),
                  options,
              )
            : this.meetingService.getAll(options);

        const populated$ = meeting$.pipe(
            skipFalsy(),
            flatMap(async meeting => {
                meeting.resources = await this.meetingService.getAccessableResources(
                    meeting.id,
                    user.id,
                );
                return meeting;
            }),
            populate(
                'owner',
                'invitations.user',
                'attendance.user',
                'resources.user.sharer',
            ),
        );

        const sorted$ = this.meetingService.sortMeetings(
            populated$,
            query.sortBy,
            query.orderBy,
        );

        const items = sorted$.pipe(
            documentToPlain(GetMeetingDto),
            toArray(),
        );

        const length = this.meetingService.countDocuments(options);

        return combineLatest(items, length).pipe(
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
            new UniqueArrayPipe(),
            new FilterNotObjectIdStringPipe(),
        )
        ids: string[],
        @Query() query: PaginationQueryDto,
    ) {
        const { resultPageNum = '1', resultPageSize } = query;

        ids = await from(ids)
            .pipe(
                flatMap(id =>
                    this.meetingService.hasViewPermission(id, user.id).pipe(
                        skipFalsy(),
                        mapTo(id),
                    ),
                ),
                toArray(),
            )
            .toPromise();

        const meeting$ = resultPageSize
            ? this.meetingService.getByIdsWithPage(
                  ids,
                  NumberUtils.parseOrThrow(resultPageSize),
                  NumberUtils.parseOrThrow(resultPageNum),
              )
            : this.meetingService.getByIds(ids);

        const populated$ = meeting$.pipe(
            flatMap(async meeting => {
                meeting.resources = await this.meetingService.getAccessableResources(
                    meeting.id,
                    user.id,
                );
                return meeting;
            }),
            populate(
                'owner',
                'invitations.user',
                'attendance.user',
                'resources.user.sharer',
            ),
        );

        const items = populated$.pipe(
            documentToPlain(GetMeetingDto),
            toArray(),
        );

        const length = this.meetingService.countDocumentsByIds(ids);

        return combineLatest(items, length).pipe(
            map(([itemList, totalLength]) => ({
                items: itemList,
                length: totalLength,
                resultPageNum: NumberUtils.parseOr(query.resultPageNum, 1),
            })),
        );
    }

    @Post()
    create(@Auth() owner: User, @Body() meeting: CreateMeetingDto) {
        return from(this.meetingService.create(meeting, owner)).pipe(
            populate('owner', 'invitations.user'),
            documentToPlain(GetMeetingDto),
        );
    }

    @Put(':id')
    @UseGuards(MeetingOwnerGuard)
    @UseGuards(MeetingGuard)
    async edit(
        @Auth() user: InstanceType<User>,
        @Param('id') id: string,
        @Body() editMeetingDto: EditMeetingDto,
    ) {
        const meeting = await this.meetingService.getById(id).toPromise();

        if (
            [MeetingStatus.Planned, MeetingStatus.Confirmed].includes(
                meeting.status,
            )
        ) {
            const newInviteeInfo = await this.meetingService.findNewInviteeInfo(
                id,
                editMeetingDto.invitations,
            );

            from(newInviteeInfo)
                .pipe(
                    flatMap(({ userId, email }) =>
                        this.notificationService.sendMeetingInvitationEmail(
                            id,
                            userId,
                            email,
                        ),
                    ),
                )
                .subscribe();
        }

        if (
            [
                MeetingStatus.Confirmed,
                MeetingStatus.Ended,
                MeetingStatus.Planned,
                MeetingStatus.Started,
            ].includes(meeting.status)
        ) {
            this.notificationService.sendMeetingInfoUpdateEmail(meeting.id);
        }

        const meeting$ = from(
            this.meetingService.edit(id, editMeetingDto),
        ).pipe(
            flatMap(async meetingInstance => {
                meetingInstance.resources = await this.meetingService.getAccessableResources(
                    meetingInstance.id,
                    user.id,
                );
                return meetingInstance;
            }),
            populate(
                'owner',
                'invitations.user',
                'attendance.user',
                'resources.user.sharer',
            ),
            documentToPlain(GetMeetingDto),
        );

        return meeting$;
    }

    @Get(':id/resources/:username')
    @UseGuards(MeetingGuard)
    async getUserSharedResource(
        @Auth() user: InstanceType<User>,
        @Param('id') id: string,
        @Param('username') username: string,
    ) {
        const targetUser = await this.userService
            .getByUsername(username)
            .toPromise();

        return from(this.meetingService.getAccessableResources(id, user.id))
            .pipe(
                pluck('user'),
                flatMap(identity),
                filter(({ sharer }) => {
                    return (sharer as Types.ObjectId).equals(targetUser._id);
                }),
                pluck('resources'),
                defaultIfEmpty(new Resources()),
            )
            .toPromise();
    }

    @Put(':id/resources/:username')
    @UseGuards(MeetingGuard)
    updateUserSharedResource(
        @Auth() user: InstanceType<User>,
        @Param('id') id: string,
        @Param('username') username: string,
        @Body() resourcesDto: MeetingResourcesDto,
    ) {
        if (user.username !== username) {
            throw new ForbiddenException();
        }

        return from(
            this.meetingService.updateUserSharedResource(
                id,
                user.id,
                resourcesDto,
            ),
        ).pipe(flatMap(() => this.getUserSharedResource(user, id, username)));
    }

    @Put(':id/status')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(MeetingOwnerGuard)
    @UseGuards(MeetingGuard)
    async editStatus(
        @Auth() owner: InstanceType<User>,
        @Param('id') id: string,
        @Body() { status }: EditMeetingStatusDto,
    ) {
        const meeting = await this.meetingService.getById(id).toPromise();

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
                    MeetingStatus.Started,
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
                    await new ValidationPipe().transformDocument(
                        meetingInstance,
                        ReadyToPlannedMeetingDto,
                    );
                    break;
            }
        };

        await checkIsMeetingValidate(meeting, status);

        const preUpdateAction = (
            oldStatus: MeetingStatus,
            newStatus: MeetingStatus,
            meetingId: string,
        ) => {
            if (newStatus === MeetingStatus.Started) {
                return defer(() => {
                    switch (oldStatus) {
                        case MeetingStatus.Confirmed:
                            return this.meetingService.edit(meetingId, {
                                realStartTime: new Date().toISOString(),
                            });
                        case MeetingStatus.Ended:
                            return from(
                                this.meetingService.isAvaialbeToBackToStart(
                                    meetingId,
                                    new Date(),
                                ),
                            ).pipe(
                                flatMap(available => {
                                    if (!available) {
                                        throw new BadRequestException(
                                            'the meeting cannot be rolled back to the started state because the end time is more than one hour',
                                        );
                                    }
                                    return this.meetingService.clearRealEndTime(
                                        meetingId,
                                    );
                                }),
                            );
                        default:
                            return empty();
                    }
                });
            }
            return empty();
        };

        await preUpdateAction(meeting.status, status, meeting.id).toPromise();
        const updatedMeeting = await this.meetingService.editStatus(id, status);

        const afterUpdateAction = (
            meetingStatus: MeetingStatus,
        ): Observable<any> => {
            switch (meetingStatus) {
                case MeetingStatus.Planned:
                    return defer(() => {
                        const inviteeInWaiting = updatedMeeting.invitations.filter(
                            item => item.status === InvitationStatus.Waiting,
                        );

                        const sendEmail$ = from(inviteeInWaiting).pipe(
                            flatMap(invitee =>
                                this.notificationService.sendMeetingInvitationEmail(
                                    updatedMeeting.id,
                                    invitee.user
                                        ? (invitee.user as Types.ObjectId).toHexString()
                                        : null,
                                    invitee.email,
                                ),
                            ),
                        );

                        const addNotification$ = from(inviteeInWaiting).pipe(
                            filter(item => Boolean(item.user)),
                            flatMap(invitee =>
                                this.notificationService.create({
                                    receiver: invitee.user as Types.ObjectId,
                                    type:
                                        NotificationType.MeetingInviteReceived,
                                    time: new Date(),
                                    object: updatedMeeting._id,
                                    objectModel:
                                        NotificationObjectModel.Meeting,
                                }),
                            ),
                        );

                        const addOwnerAttendance$ = from(
                            this.meetingService.addAttendance(id, owner.id),
                        );

                        return of(
                            sendEmail$,
                            addNotification$,
                            addOwnerAttendance$,
                        ).pipe(mergeAll());
                    });
                case MeetingStatus.Ended:
                    return defer(() =>
                        this.meetingService.edit(updatedMeeting.id, {
                            realEndTime: new Date().toISOString(),
                        }),
                    );
                case MeetingStatus.Cancelled:
                    return defer(() => {
                        return from(
                            updatedMeeting.attendance
                                .map(item => item.user as Types.ObjectId)
                                .filter(item => !item.equals(owner.id)),
                        ).pipe(
                            flatMap(receiver =>
                                this.notificationService.create({
                                    receiver,
                                    type: NotificationType.MeetingCancelled,
                                    time: new Date(),
                                    object: updatedMeeting._id,
                                    objectModel:
                                        NotificationObjectModel.Meeting,
                                }),
                            ),
                            toArray(),
                            flatMap(() =>
                                this.notificationService.sendMeetingCancelledEmail(
                                    updatedMeeting.id,
                                ),
                            ),
                        );
                    });
                default:
                    return empty();
            }
        };

        afterUpdateAction(status).subscribe();
    }

    @Delete(':id')
    @UseGuards(MeetingOwnerGuard)
    @UseGuards(MeetingGuard)
    async delete(@Param('id') id: string) {
        await this.meetingService.delete(id);
    }

    @Put(':id/invitation')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(MeetingGuard)
    async acceptOrRejctInvitation(
        @Auth() user: InstanceType<User>,
        @Param('id') id: string,
        @Body() acceptDto: AcceptDto,
    ) {
        const isInvited$ = this.meetingService
            .countDocuments({
                $and: [
                    { _id: { $eq: Types.ObjectId(id) } },
                    {
                        invitations: {
                            $elemMatch: {
                                user: {
                                    $eq: Types.ObjectId(user.id),
                                },
                                status: {
                                    $in: [InvitationStatus.Waiting],
                                },
                            },
                        },
                    },
                ],
            })
            .pipe(
                tap(item => {
                    if (item === 0) {
                        throw new BadRequestException(
                            'You have not been invited to this meeting or have accepted or rejected this invitation.',
                        );
                    }
                }),
            );

        const addAttendance$ = defer(() =>
            acceptDto.accept
                ? this.meetingService.addAttendance(id, user.id)
                : empty(),
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

        addAttendance$.subscribe();
    }

    @Get(':id/suggest-time')
    @UseGuards(MeetingOwnerGuard)
    @UseGuards(MeetingGuard)
    async getSuggestTime(
        @Auth() user: InstanceType<User>,
        @Param('id') id: string,
        @Query() query: MeetingSuggestTimeQuery,
    ) {
        const [fromDate, toDate] = [query.fromDate, query.toDate].map(d =>
            d.getTime(),
        );

        const [searchTimeRangeMin, searchTimeRangeMax] = [
            query.fromTime,
            query.toTime,
        ].map(d => DateUtils.toHourMinuteString(d));

        if (query.weekDays.length === 0) {
            throw new BadRequestException(
                'weekDays must contain at least 1 elements',
            );
        }

        if (fromDate >= toDate) {
            throw new BadRequestException(
                'fromDate must be smaller than toDate',
            );
        }

        const busyTime$ = from(
            this.getBusyTime(user, id, {
                fromDate: new Date(fromDate),
                toDate: new Date(toDate),
            }),
        ).pipe(
            flatMap(identity),
            flatMap(({ items }) => items),
            shareReplay(),
        );

        const meeting$ = this.meetingService.getById(id);

        const meetingLength$ = meeting$.pipe(
            pluck('length'),
            shareReplay(),
        );

        const selectedRange$ = interval().pipe(
            flatMap(time =>
                meetingLength$.pipe(
                    map(length => [
                        fromDate + 1800000 * time,
                        fromDate + 1800000 * time + length,
                    ]),
                ),
            ),
        );

        const freeTimeRange$ = selectedRange$.pipe(
            // filter date in range
            takeWhile(([_, checkingDateMax]) => checkingDateMax <= toDate),
            // filter day in weekdays and time in range
            filter(([fromDateTime, toDateTime]) => {
                const fromDateIns = new Date(fromDateTime);
                const toDateIns = new Date(toDateTime);

                const [checkingTimeStart, checkingTimeEnd] = [
                    fromDateIns,
                    toDateIns,
                ].map(d => DateUtils.toHourMinuteString(d));

                const inWeekDays =
                    query.weekDays.includes(fromDateIns.getDay()) &&
                    query.weekDays.includes(toDateIns.getDay());

                if (!inWeekDays) {
                    return false;
                }

                if (searchTimeRangeMax === searchTimeRangeMin) {
                    return true;
                }

                if (searchTimeRangeMax > searchTimeRangeMin) {
                    if (checkingTimeStart > checkingTimeEnd) {
                        return false;
                    }
                    if (
                        checkingTimeStart < searchTimeRangeMin ||
                        checkingTimeEnd > searchTimeRangeMax
                    ) {
                        return false;
                    }
                    return true;
                }

                if (searchTimeRangeMin > searchTimeRangeMax) {
                    if (
                        searchTimeRangeMin < checkingTimeStart &&
                        checkingTimeStart < searchTimeRangeMax
                    ) {
                        return false;
                    }
                    if (
                        searchTimeRangeMin < checkingTimeEnd &&
                        checkingTimeEnd < searchTimeRangeMax
                    ) {
                        return false;
                    }
                    return true;
                }

                return false;
            }),
            flatMap(([fromDateTime, toDateTime]) =>
                busyTime$.pipe(
                    toArray(),
                    map(items => {
                        const filted = items.filter(busy => {
                            const inRange = (ms: number) =>
                                fromDateTime <= ms && ms <= toDateTime;
                            return (
                                inRange(busy.fromDate.getTime()) ||
                                inRange(busy.toDate.getTime())
                            );
                        });
                        return (
                            filted.reduce((acc, xs) => acc + xs.busyLevel, 0) /
                            (filted.length || 1)
                        );
                    }),
                    map(busyLevel => ({
                        fromDateTime,
                        toDateTime,
                        busyLevel,
                    })),
                ),
            ),
            toArray(),
            map(items => items.sort((a, b) => a.busyLevel - b.busyLevel)),
            flatMap(identity),
        );

        return freeTimeRange$.pipe(
            take(query.take || 5),
            map(item => ({
                fromDate: new Date(item.fromDateTime),
                toDate: new Date(item.toDateTime),
                busyLevel: item.busyLevel,
            })),
            map(item => ObjectUtils.ObjectToPlain(item, SuggestTimeDto)),
            toArray(),
            map(items => ({ items, length: items.length })),
        );
    }

    @Get(':id/busy-time')
    @UseGuards(MeetingOwnerGuard)
    @UseGuards(MeetingGuard)
    async getBusyTime(
        @Auth() user: InstanceType<User>,
        @Param('id') id: string,
        @Query() query: MeetingBusyTimeQueryDto,
    ) {
        const friendsIds = await from(
            this.meetingService.getAllFriendIdsInInvitations(id, user.id),
        )
            .pipe(map(list => [...new Set(list).add(user.id)]))
            .toPromise();

        const friend$ = from(friendsIds).pipe(
            flatMap(friendId => this.userService.getById(friendId)),
            skipFalsy(),
            shareReplay(),
        );

        const friendJoinedMeeting$ = friend$.pipe(
            flatMap(friend =>
                this.meetingService.getAllUserJoinedMeetingInRange({
                    userId: friend.id,
                    fromDate: query.fromDate,
                    toDate: query.toDate,
                }),
            ),
        );

        const whoHasGoogleService$ = friend$.pipe(
            filter(({ googleRefreshToken }) => Boolean(googleRefreshToken)),
            flatMap(async item => {
                return {
                    item,
                    available: await this.googleAuthService.isRefreshTokenAvailable(
                        item.googleRefreshToken,
                    ),
                };
            }),
            filter(({ available }) => available),
            map(({ item }) => item),
            shareReplay(),
        );

        const userRefreshToken$ = whoHasGoogleService$.pipe(
            pluck('googleRefreshToken'),
            shareReplay(),
        );

        const userCalendarIdList$ = whoHasGoogleService$.pipe(
            map(item =>
                item.setting.calendarImportance.map(cal => cal.calendarId),
            ),
        );

        const userBusyEventCalendar$ = zip(
            userRefreshToken$,
            userCalendarIdList$,
        ).pipe(
            concatMap(([refreshToken, calendarIds]) =>
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
            filter(
                ([userInstance, eventCalendar]) =>
                    Boolean(userInstance) && Boolean(eventCalendar),
            ),
            flatMap(([userInstance, eventCalendar]) =>
                from(eventCalendar).pipe(
                    filter(item => typeof item === 'object'),
                    map(item => {
                        return Object.entries(item)
                            .filter(
                                ([_, freebusy]) => typeof freebusy === 'object',
                            )
                            .map(([calendar, freebusy]) => {
                                const find = userInstance.setting.calendarImportance.find(
                                    val => val.calendarId === calendar,
                                );
                                return {
                                    ...freebusy,
                                    level: find ? find.importance : 3,
                                };
                            });
                    }),
                    catchError(() => empty()),
                    flatMap(identity),
                    filter(item => !item.errors),
                    flatMap(item =>
                        item.busy.map(busy => ({ ...busy, level: item.level })),
                    ),
                    map(({ start, end, level }) => ({
                        fromDate: new Date(start),
                        toDate: new Date(end),
                        user: userInstance,
                        busyLevel: level,
                    })),
                ),
            ),
        );

        const systemBusyTime$ = zip(friend$, friendJoinedMeeting$).pipe(
            flatMap(([userInstance, meetingList]) =>
                from(meetingList).pipe(
                    map(item => ({
                        fromDate: item.plannedStartTime,
                        toDate: item.plannedEndTime,
                        user: userInstance,
                        busyLevel: item.priority,
                    })),
                ),
            ),
        );

        const groupedBusyTime$ = merge(busyTime$, systemBusyTime$).pipe(
            toArray(),
            map(items => {
                const list: Array<{
                    fromDate: Date;
                    toDate: Date;
                    users: Array<InstanceType<User>>;
                    busyLevel: number;
                }> = [];

                if (!items.length) {
                    return list;
                }

                const sorted = items.sort(item => item.fromDate.getTime());
                for (
                    let loopTime = items[0].fromDate;
                    loopTime.getTime() <=
                    items[items.length - 1].toDate.getTime();
                    loopTime = new Date(loopTime.getTime() + 30 * 60000)
                ) {
                    const inRange = sorted.filter(
                        item =>
                            item.fromDate <= loopTime &&
                            loopTime <= item.toDate,
                    );
                    if (!inRange.length) {
                        continue;
                    }

                    const userUnique = [
                        ...new Set(inRange.map(item => item.user)),
                    ];
                    const busyLevelUnique = new Map();
                    inRange.map(item => {
                        const old = busyLevelUnique.get(item.user.username);
                        if (!old || old > item.busyLevel) {
                            busyLevelUnique.set(
                                item.user.username,
                                item.busyLevel,
                            );
                        }
                    });

                    list.push({
                        fromDate: loopTime,
                        toDate: new Date(loopTime.getTime() + 30 * 60000),
                        users: userUnique,
                        busyLevel:
                            [...busyLevelUnique.values()].reduce(
                                (acc, xs) => acc + ((4 - xs) / 3) * 100,
                                0,
                            ) / friendsIds.length,
                    });
                }

                return list;
            }),
            flatMap(identity),
        );

        const result$ = groupedBusyTime$.pipe(
            filter(item => Boolean(item.fromDate) && Boolean(item.toDate)),
            map(item => ({
                ...item,
                fromDate: new Date(item.fromDate),
                toDate: new Date(item.toDate),
            })),
        );

        return result$.pipe(
            map(item => ObjectUtils.ObjectToPlain(item, BusyTimeDto)),
            toArray(),
            map(items => ({ items, length: items.length })),
        );
    }

    @Put(':id/calendar')
    @UseGuards(MeetingGuard)
    async markOrUnMarkCalendar(
        @Auth() user: InstanceType<User>,
        @Param('id') id: string,
    ) {
        if (!user.googleRefreshToken) {
            throw new BadRequestException(
                'user should first connect to Google',
            );
        }

        if (!user.setting.markEventOnCalendarId) {
            throw new BadRequestException(
                'user should first set up a calendar to mark events',
            );
        }

        const meeting = await this.meetingService.getById(id).toPromise();

        const attendee = meeting.attendance.find(item =>
            Types.ObjectId(user.id).equals(item.user as any),
        );

        if (!attendee) {
            throw new BadRequestException(
                'user should first accept the meeting invitation',
            );
        }

        if (attendee.googleCalendarEventId) {
            await this.googleCalendarService
                .unmarkEventOnCalendar(
                    user.googleRefreshToken,
                    attendee.googleCalendarEventId,
                    user.setting.markEventOnCalendarId,
                )
                .toPromise();

            attendee.googleCalendarEventId = undefined;

            await meeting.save();
            return {
                isMarked: false,
            };
        }

        const event = this.googleCalendarService.generateEventFromMeeting(
            meeting,
        );

        const markedEvent = await this.googleCalendarService
            .markEventOnCalendar(
                user.googleRefreshToken,
                user.setting.markEventOnCalendarId,
                event,
            )
            .toPromise();

        attendee.googleCalendarEventId = markedEvent.data.id;
        await meeting.save();
        return {
            isMarked: true,
        };
    }

    @Put(':id/attendance/:attendee')
    @UseGuards(MeetingOwnerGuard)
    @UseGuards(MeetingGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async updateAttendeeStatus(
        @Param('id') id: string,
        @Param('attendee') attendeeUsername: string,
        @Body() editAttendeeStatusDto: EditAttendeeStatusDto,
    ) {
        const attendee$ = this.userService.getByUsername(attendeeUsername).pipe(
            tap(attendee => {
                if (!attendee) {
                    throw new BadRequestException(
                        'attendee is not in the system',
                    );
                }
            }),
        );

        const isAttendeeExist$ = attendee$.pipe(
            flatMap(attendee =>
                this.meetingService.isAttendeeExist(id, attendee.id),
            ),
        );

        const updatedStatus$ = zip(attendee$, isAttendeeExist$).pipe(
            flatMap(([attendee, exist]) => {
                if (!exist) {
                    throw new BadRequestException(
                        'attendee is not in the meeting',
                    );
                }

                return this.meetingService.updateAttendeeStatus(
                    id,
                    attendee.id,
                    editAttendeeStatusDto.status,
                );
            }),
        );

        await updatedStatus$.toPromise();

        const afterUpdateAction = (status: AttendanceStatus) => {
            switch (status) {
                case AttendanceStatus.Present:
                    return attendee$.pipe(
                        flatMap(attendee =>
                            this.meetingService.updateAttendeeArrivalTime(
                                id,
                                attendee.id,
                            ),
                        ),
                    );
                default:
                    return empty();
            }
        };

        afterUpdateAction(editAttendeeStatusDto.status).subscribe();
    }
}
