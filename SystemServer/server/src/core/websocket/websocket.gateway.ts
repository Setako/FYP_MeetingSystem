import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DeviceOnlineDto } from './dto/device-online.dto';
import { DeviceService } from '../device/device.service';
import { tap, map, concatAll, takeLast, catchError } from 'rxjs/operators';
import { of, from, defer } from 'rxjs';
import { UsePipes, UseGuards, UseFilters } from '@nestjs/common';
import { WsValidationPipe } from '@commander/shared/pipe/ws-validation.pipe';
import { ClientTakeOverDeviceDto } from './dto/client-take-over-device.dto';
import { WsAuthGuard } from '@commander/shared/guard/ws-auth.guard';
import { WsMeetingOwnerGuard } from '@commander/shared/guard/ws-meeting-owner.guard';
import { MeetingService } from '../meeting/meeting.service';
import { DeviceLanIpDto } from './dto/device-lan-ip.dto';
import { WsExceptionFilter } from '@commander/shared/filter/ws-exception.filter';

@UseFilters(WsExceptionFilter)
@UsePipes(WsValidationPipe)
@WebSocketGateway()
export class WebsocketGateway {
    @WebSocketServer() server: Server;

    constructor(
        private readonly deviceService: DeviceService,
        private readonly meetingService: MeetingService,
    ) {}

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
                socket.join(deviceId);
                socket.join('abc');
            }),
        );

        const token$ = of(deviceId).pipe(
            map(deviceid => ({
                accessToken: this.deviceService.signToken(deviceid),
            })),
        );

        return of(checkSecret$, joinRoom$, token$).pipe(
            concatAll(),
            takeLast(1),
            map(data => ({
                event: 'device-access-token',
                data,
            })),
        );
    }

    @UseFilters(new WsExceptionFilter('client-access-denied'))
    @UseGuards(WsMeetingOwnerGuard)
    @UseGuards(WsAuthGuard)
    @SubscribeMessage('client-take-over-device')
    async onClientTakeOverDevice(
        client: Socket,
        { accessToken, meetingId }: ClientTakeOverDeviceDto,
    ) {
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
            this.meetingService.updateDevice(meetingId, deviceId),
        );

        const deviceTakeOver$ = of(client).pipe(
            tap(socket =>
                socket.to(deviceId).emit('device-take-over', {
                    meetingId,
                }),
            ),
        );

        const joinRoom$ = of(client).pipe(
            tap(socket => {
                socket.join(deviceId);
            }),
        );

        await from([
            checkAccessTokenValid$,
            updateDevice$,
            deviceTakeOver$,
            joinRoom$,
        ])
            .pipe(concatAll())
            .toPromise();
    }

    @SubscribeMessage('device-lan-ip')
    onDeviceLanIp(client: Socket, { lanIP, controlToken }: DeviceLanIpDto) {
        Object.keys(client.rooms).forEach(room =>
            client.to(room).emit('client-access-allowed', {
                deviceLanIP: lanIP,
                controlToken,
            }),
        );
    }
}
