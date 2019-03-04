import { UseFilters, UsePipes } from '@nestjs/common';
import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as ip from 'ip';
import * as io from 'socket.io-client';

const uuidv4 = require('uuid/v4');

import { CoreService } from './core.service';
import { WsExceptionFilter } from '../shared/ws-exception.filter';
import { WsValidationPipe } from '../shared/ws-validation.pipe';
import { ClientOnlineDto } from './dto/client-online.dto';

@UseFilters(new WsExceptionFilter())
@UsePipes(WsValidationPipe)
@WebSocketGateway()
export class CoreGateway implements OnGatewayInit, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    socketClient: SocketIOClient.Socket;

    controlToken: string = uuidv4();

    holdingMeetingId: string;

    holdingMeeting: any;

    constructor(private readonly ipcService: CoreService) {
        this.setupSocketClinet();
    }

    afterInit(_server: Socket) {}

    handleDisconnect(client: Socket) {}

    setupSocketClinet() {
        this.ipcService.getMessage('ready-to-connect-socket').subscribe(() => {
            this.socketClient = io(
                'https://conference-commander.herokuapp.com',
            );

            this.socketClient.on('connect', () => {
                this.socketClient.emit('device-online', {
                    deviceId: this.ipcService.electronGlobal.device.id,
                    secret: this.ipcService.electronGlobal.device.secret,
                });
            });

            this.socketClient.on('exception', (data: any) => {
                this.ipcService.sendMessage('server-exception', data);
            });

            this.socketClient.on('device-access-token', (data: any) => {
                this.ipcService.sendMessage('show-token', data);
            });

            this.socketClient.on('device-take-over', ({ meetingId }) => {
                this.controlToken = uuidv4();
                this.holdingMeetingId = meetingId;

                this.socketClient.emit('device-get-meeting');
            });

            this.socketClient.on('device-get-meeting-reply', (meeting: any) => {
                this.holdingMeeting = meeting;

                this.ipcService.sendMessage('take-over', {
                    controlToken: this.controlToken,
                    meeting,
                });

                this.socketClient.emit('device-lan-ip', {
                    lanIP: `${ip.address()}:${
                        this.ipcService.electronGlobal.socket.port
                    }`,
                    controlToken: this.controlToken,
                });
            });

            this.socketClient.on('server-attendance-updated', (data: any) => {
                this.ipcService.sendMessage('attendance-updated', data);
            });

            this.socketClient.on('client-end-meeting', () => {
                this.socketClient.disconnect();
                this.socketClient.connect();

                this.holdingMeeting = null;
                this.holdingMeetingId = null;
                this.controlToken = uuidv4();

                this.ipcService.sendMessage('server-disconnected');
            });

            this.socketClient.on('disconnect', () => {
                this.socketClient.connect();

                this.holdingMeeting = null;
                this.holdingMeetingId = null;
                this.controlToken = uuidv4();

                this.ipcService.sendMessage('server-disconnected');
            });
        });
    }

    @UseFilters(new WsExceptionFilter('client-online'))
    @SubscribeMessage('client-online')
    onClientOnline(client: Socket, { controlToken }: ClientOnlineDto) {
        if (this.controlToken !== controlToken) {
            throw new WsException('Incorrect control token');
        }

        client.request.controlToken = this.controlToken;

        return {
            event: 'client-online-success',
        };
    }

    @UseFilters(new WsExceptionFilter('send-action'))
    @SubscribeMessage('send-action')
    onSendAction(client: Socket, data: any) {
        const { controlToken } = client.request;

        if (this.controlToken !== controlToken) {
            throw new WsException('Control token is fake or expired');
        }

        this.ipcService.sendMessage('send-action', data);

        return {
            event: 'send-action-success',
        };
    }
}
