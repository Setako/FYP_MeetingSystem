import { WsExceptionFilter } from '@commander/shared/filter/ws-exception.filter';
import { WsAuthGuard } from '@commander/shared/guard/ws-auth.guard';
import { WsMeetingOwnerGuard } from '@commander/shared/guard/ws-meeting-owner.guard';
import { WsValidationPipe } from '@commander/shared/pipe/ws-validation.pipe';
import { UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import {
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsException,
    OnGatewayDisconnect,
    OnGatewayInit,
} from '@nestjs/websockets';
import { defer, from, of, concat } from 'rxjs';
import {
    catchError,
    concatAll,
    map,
    takeLast,
    tap,
    flatMap,
    filter,
} from 'rxjs/operators';
import { Server, Socket } from 'socket.io';
import { DeviceService } from '../device/device.service';
import { MeetingService } from '../meeting/meeting.service';
import { ClientTakeOverDeviceDto } from './dto/client-take-over-device.dto';
import { DeviceLanIpDto } from './dto/device-lan-ip.dto';
import { DeviceOnlineDto } from './dto/device-online.dto';
import { OwnerAuthDto } from './dto/owner-auth.dto';
import { InstanceType } from 'typegoose';
import { Meeting, MeetingStatus } from '../meeting/meeting.model';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { UserService } from '../user/user.service';
import { populate } from '@commander/shared/operator/document';
import { ObjectUtils } from '@commander/shared/utils/object.utils';
import { GetMeetingDto } from '../meeting/dto/get-meeting.dto';
import { User } from '../user/user.model';
import { Types } from 'mongoose';
import { WsDeviceHoldMeetingGuard } from '@commander/shared/guard/ws-device-hold-meeting.guard';

@UseFilters(WsExceptionFilter)
@UsePipes(WsValidationPipe)
@WebSocketGateway()
export class WebsocketGateway implements OnGatewayInit, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    constructor(
        private readonly deviceService: DeviceService,
        private readonly meetingService: MeetingService,
        private readonly userService: UserService,
    ) {}

    afterInit(_server: Socket) {
        this.meetingService.turnAllStartedMeetingsToEnded().subscribe();
    }

    handleDisconnect(client: Socket) {
        const {
            user,
            meeting,
        }: {
            user: InstanceType<User>;
            meeting: InstanceType<Meeting>;
        } = client.request;

        if (user && meeting) {
            this.meetingService
                .getById(meeting.id)
                .pipe(
                    filter(item => item.status === MeetingStatus.Started),
                    filter(item =>
                        Types.ObjectId(user.id).equals(item.owner as any),
                    ),
                    flatMap(item => {
                        item.realEndTime = new Date();
                        item.status = MeetingStatus.Ended;
                        return item.save();
                    }),
                )
                .subscribe();
        }
    }

    @UseFilters(new WsExceptionFilter('device-online'))
    @SubscribeMessage('device-online')
    onDeviceOnline(client: Socket, { deviceId, secret }: DeviceOnlineDto) {
        const checkSecret$ = this.deviceService
            .isDeviceSecretAvailable(deviceId, secret)
            .pipe(
                tap(available => {
                    if (!available) {
                        throw new WsException('device secret is not available');
                    }
                }),
            );

        const joinRoom$ = of(client).pipe(
            tap(socket => {
                socket.leaveAll();
                socket.join(`device:${deviceId}`);
            }),
        );

        const bindDevice$ = this.deviceService
            .getById(deviceId)
            .pipe(tap(device => (client.request.device = device)));

        const token$ = of(deviceId).pipe(
            map(deviceid => ({
                accessToken: this.deviceService.signToken(deviceid),
            })),
        );

        return of(checkSecret$, bindDevice$, joinRoom$, token$).pipe(
            concatAll(),
            takeLast(1),
            map(data => ({
                event: 'device-access-token',
                data,
            })),
        );
    }

    @UseGuards(WsMeetingOwnerGuard)
    @UseGuards(WsAuthGuard)
    @UseFilters(new WsExceptionFilter('client-take-over-device'))
    @SubscribeMessage('client-take-over-device')
    async onClientTakeOverDevice(
        client: Socket,
        { accessToken }: ClientTakeOverDeviceDto,
    ) {
        const { meeting }: { meeting: InstanceType<Meeting> } = client.request;

        const checkAccessTokenValid$ = of(accessToken).pipe(
            map(token => this.deviceService.verifyToken(token)),
            catchError(e => {
                const message = e.message
                    .replace('token', 'state')
                    .replace('jwt', 'accessoken');
                throw new WsException(message);
            }),
        );

        const deviceId = this.deviceService.decodeToken(accessToken);

        const updateDevice$ = defer(() =>
            this.meetingService.updateDevice(meeting.id, deviceId),
        );

        const deviceTakeOver$ = of(client).pipe(
            tap(socket =>
                socket.to(`device:${deviceId}`).emit('device-take-over', {
                    meetingId: meeting.id,
                }),
            ),
        );

        const joinRoom$ = of(client).pipe(
            tap(socket => {
                Object.values(
                    this.server.in(`device:${deviceId}`).connected,
                ).forEach(device => {
                    device
                        .join(`meeting:${meeting.id}_device`)
                        .join(`meeting:${meeting.id}`);
                });

                socket
                    .join(`meeting:${meeting.id}_client`)
                    .join(`meeting:${meeting.id}`);
            }),
        );

        const bindMeetingToDevice = of(meeting.id).pipe(
            flatMap(id => this.meetingService.getById(id)),
            tap(updatedMeeting =>
                Object.values(
                    this.server.in(`device:${deviceId}`).connected,
                ).forEach(device => {
                    device.request.meeting = updatedMeeting;
                }),
            ),
        );

        await from([
            checkAccessTokenValid$,
            updateDevice$,
            deviceTakeOver$,
            joinRoom$,
            bindMeetingToDevice,
        ])
            .pipe(concatAll())
            .toPromise();
    }

    @UseGuards(WsDeviceHoldMeetingGuard)
    @UseFilters(new WsExceptionFilter('device-lan-ip'))
    @SubscribeMessage('device-lan-ip')
    onDeviceLanIp(client: Socket, { lanIP, controlToken }: DeviceLanIpDto) {
        const { meeting }: { meeting: InstanceType<Meeting> } = client.request;

        client.to(`meeting:${meeting.id}`).emit('client-access-allowed', {
            deviceLanIP: lanIP,
            controlToken,
        });
    }

    @UseGuards(WsMeetingOwnerGuard)
    @UseGuards(WsAuthGuard)
    @UseFilters(new WsExceptionFilter('client-start-meeting'))
    @SubscribeMessage('client-start-meeting')
    onClientStartMeeting(client: Socket, _data: OwnerAuthDto) {
        const {
            meeting,
        }: {
            meeting: InstanceType<Meeting>;
        } = client.request;

        if (
            ![
                MeetingStatus.Confirmed,
                MeetingStatus.Ended,
                MeetingStatus.Started,
            ].includes(meeting.status)
        ) {
            throw new WsException(
                'Meeting status are not allowed to be updated as started',
            );
        }

        const preUpdateAction$ = defer(() =>
            meeting.status === MeetingStatus.Confirmed
                ? from(
                      this.meetingService.edit(meeting.id, {
                          realStartTime: new Date().toISOString(),
                      }),
                  )
                : from(
                      this.meetingService.isAvaialbeToBackToStart(
                          meeting.id,
                          new Date(),
                      ),
                  ).pipe(
                      tap(available => {
                          if (!available) {
                              throw new WsException(
                                  'the meeting cannot be rolled back to the started state because the end time is more than one hour',
                              );
                          }
                      }),
                      flatMap(() =>
                          this.meetingService.clearRealEndTime(meeting.id),
                      ),
                  ),
        );

        const updatedMeeting$ = of(meeting.id).pipe(
            flatMap(meetingId =>
                this.meetingService.editStatus(
                    meetingId,
                    MeetingStatus.Started,
                ),
            ),
        );

        const joinRooms = () =>
            tap(() => {
                client
                    .join(`meeting:${meeting.id}_client`)
                    .join(`meeting:${meeting.id}`);
            });

        return concat(preUpdateAction$, updatedMeeting$).pipe(
            takeLast(1),
            map(({ realStartTime }) => ({
                event: 'client-start-meeting-success',
                data: {
                    realStartTime,
                },
            })),
            joinRooms(),
        );
    }

    @UseGuards(WsMeetingOwnerGuard)
    @UseGuards(WsAuthGuard)
    @UseFilters(new WsExceptionFilter('client-end-meeting'))
    @SubscribeMessage('client-end-meeting')
    onClientEndMeeting(client: Socket, _data: any) {
        const {
            meeting,
        }: {
            meeting: InstanceType<Meeting>;
        } = client.request;

        if (MeetingStatus.Started !== meeting.status) {
            throw new WsException(
                'Meeting status are not allowed to be updated as ended',
            );
        }

        return from(
            this.meetingService.edit(meeting.id, {
                realEndTime: new Date().toISOString(),
            }),
        ).pipe(
            flatMap(() =>
                this.meetingService.editStatus(meeting.id, MeetingStatus.Ended),
            ),
            map(({ realEndTime }) => ({
                event: 'client-end-meeting-success',
                data: {
                    realEndTime,
                },
            })),
        );
    }

    @UseGuards(WsMeetingOwnerGuard)
    @UseGuards(WsAuthGuard)
    @UseFilters(new WsExceptionFilter('client-mark-attendance'))
    @SubscribeMessage('client-mark-attendance')
    onClientMarkAttendance(client: Socket, { attendance }: MarkAttendanceDto) {
        const { meeting }: { meeting: InstanceType<Meeting> } = client.request;

        const updatedAttendance$ = from(attendance).pipe(
            flatMap(({ username, time }) =>
                this.userService.getByUsername(username).pipe(
                    map(user => ({
                        user,
                        arrivalTime: time,
                    })),
                ),
            ),
            filter(item => Boolean(item.user)),
            flatMap(item =>
                this.meetingService.updateAttendeeArrivalTime(
                    meeting.id,
                    item.user.id,
                    item.arrivalTime,
                ),
            ),
        );

        return updatedAttendance$.pipe(
            populate('attendance.user'),
            map(updatedMeeting => ({
                event: 'client-attendance-updated',
                data: {
                    attendance: ObjectUtils.DocumentToPlain(
                        updatedMeeting,
                        GetMeetingDto,
                    ).attendance,
                },
            })),
            tap(({ data }) =>
                client
                    .to(`meeting:${meeting.id}_device`)
                    .emit('server-attendance-updated', data),
            ),
        );
    }

    @UseGuards(WsDeviceHoldMeetingGuard)
    @UseFilters(new WsExceptionFilter('device-mark-attendance'))
    @SubscribeMessage('device-mark-attendance')
    onDeviceMarkAttendance(client: Socket, { attendance }: MarkAttendanceDto) {
        const { meeting }: { meeting: InstanceType<Meeting> } = client.request;

        const updatedAttendance$ = from(attendance).pipe(
            flatMap(({ username, time }) =>
                this.userService.getByUsername(username).pipe(
                    map(user => ({
                        user,
                        arrivalTime: time,
                    })),
                ),
            ),
            filter(item => Boolean(item.user)),
            flatMap(item =>
                this.meetingService.updateAttendeeArrivalTime(
                    meeting.id,
                    item.user.id,
                    item.arrivalTime,
                ),
            ),
        );

        return updatedAttendance$.pipe(
            populate('attendance.user'),
            map(updatedMeeting => ({
                event: 'server-attendance-updated',
                data: {
                    attendance: ObjectUtils.DocumentToPlain(
                        updatedMeeting,
                        GetMeetingDto,
                    ).attendance,
                },
            })),
            tap(({ data }) =>
                client
                    .to(`meeting:${meeting.id}_client`)
                    .emit('client-attendance-updated', data),
            ),
        );
    }
}
