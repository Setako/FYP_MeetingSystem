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
} from 'rxjs';
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
    catchError,
    mergeAll,
} from 'rxjs/operators';
import { InstanceType } from 'typegoose';
import { MeetingOwnerGuard } from '@commander/shared/guard/meeting-owner.guard';
import { Types } from 'mongoose';
import {
    InvitationStatus,
    MeetingStatus,
    Meeting,
    AttendanceStatus,
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
import { DeviceService } from '../device/device.service';
import { EditAttendeeStatusDto } from './dto/edit-attendee-status.dto';

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
        private readonly deviceService: DeviceService,
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
                item
                    .populate('owner invitations.user attendance.user')
                    .execPopulate(),
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
                item
                    .populate('owner invitations.user attendance.user')
                    .execPopulate(),
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
                    .populate('owner invitations.user attendance.user')
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
        @Auth() owner: InstanceType<User>,
        @Param('id') id: string,
        @Body() { status, ...editStatusDto }: EditMeetingStatusDto,
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
            editStatusPartial: Partial<EditMeetingStatusDto>,
        ) => {
            switch (editedStatus) {
                case MeetingStatus.Planned:
                    await new ValidationPipe({
                        transform: true,
                    }).transformDocument(
                        meetingInstance,
                        ReadyToPlannedMeetingDto,
                    );
                    break;
                case MeetingStatus.Started:
                    await defer(() =>
                        editStatusPartial.deviceToken
                            ? of(editStatusPartial.deviceToken).pipe(
                                  map(token =>
                                      this.deviceService.verifyToken(token),
                                  ),
                                  catchError(e => {
                                      const message = e.message
                                          .replace('token', 'state')
                                          .replace('jwt', 'token');
                                      throw new BadRequestException(message);
                                  }),
                              )
                            : empty(),
                    ).toPromise();
            }
        };

        await checkIsMeetingValidate(meeting, status, editStatusDto);

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
                            item =>
                                item.status === InvitationStatus.Waiting &&
                                item.user,
                        );

                        const addNotification$ = from(inviteeInWaiting).pipe(
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

                        return of(addNotification$, addOwnerAttendance$).pipe(
                            mergeAll(),
                        );
                    });
                case MeetingStatus.Started:
                    return defer(() =>
                        editStatusDto.deviceToken
                            ? this.meetingService.updateDevice(
                                  updatedMeeting.id,
                                  this.deviceService.decodeToken(
                                      editStatusDto.deviceToken,
                                  ),
                              )
                            : empty(),
                    );
                case MeetingStatus.Ended:
                    return defer(() =>
                        this.meetingService.edit(updatedMeeting.id, {
                            realEndTime: new Date().toISOString(),
                        }),
                    );
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

    @Get(':id/busy-time')
    @UseGuards(MeetingOwnerGuard)
    @UseGuards(MeetingGuard)
    async getBusyTime(
        @Auth() user: InstanceType<User>,
        @Param('id') id: string,
        @Query() query: MeetingBusyTimeQueryDto,
    ) {
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
            flatMap(([refreshToken, calendarIds]) => {
                return this.googleEventService.getAllBusyEvent({
                    refreshToken,
                    calendarIds,
                    timeMax: query.toDate,
                    timeMin: query.fromDate,
                });
            }),
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

        const systemBusyTime$ = zip(friend$, friendJoinedMeeting$).pipe(
            flatMap(([userInstance, meetingList]) =>
                from(meetingList).pipe(
                    map(item => ({
                        fromDate: item.plannedStartTime,
                        toDate: item.plannedEndTime,
                        user: userInstance,
                    })),
                ),
            ),
        );

        const groupedBusyTime$ = merge(busyTime$, systemBusyTime$).pipe(
            groupBy(time => ({
                a: time.fromDate.getTime(),
                b: time.fromDate.getTime(),
            })),
            flatMap(group => group.pipe(toArray())),
        );

        const result$ = groupedBusyTime$.pipe(
            map(group => ({
                fromDate: group.length !== 0 ? group[0].fromDate : undefined,
                toDate: group.length !== 0 ? group[0].toDate : undefined,
                users: group.reduce(
                    (acc, xs) =>
                        acc.includes(xs.user) ? acc : acc.concat(xs.user),
                    [] as Array<InstanceType<User>>,
                ),
            })),
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
            map(items => ({ items })),
        );
    }

    @Put(':id/calendar')
    @UseGuards(MeetingGuard)
    async markOrUnMarkCalendar() {
        // Todo: mark the calendar
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
        const attendee$ = from(
            this.userService.getByUsername(attendeeUsername),
        ).pipe(
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
