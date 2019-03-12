import { UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import {
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsException,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as ip from 'ip';
import * as io from 'socket.io-client';
import * as child from 'child_process';
import { spawn } from 'child_process';
import { IpcService } from './ipc.service';
import { ConfigService } from './config.service';
import { WsExceptionFilter } from '../shared/ws-exception.filter';
import { WsValidationPipe } from '../shared/ws-validation.pipe';
import { ClientOnlineDto } from '../shared/client-online.dto';
import { RecognitionOnlineDto } from '../shared/recognition-online.dto';
import { WsRecognitionGuard } from '../shared/ws-recognition.guard';

const uuidv4 = require('uuid/v4');

@UseFilters(new WsExceptionFilter())
@UsePipes(WsValidationPipe)
@WebSocketGateway()
export class CoreGateway implements OnGatewayInit, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    socketClient: SocketIOClient.Socket;

    controlToken: string = uuidv4();

    holdingMeetingId: string;

    holdingMeeting: any;

    recognitionClient: Socket;

    constructor(
        private readonly ipcService: IpcService,
        private readonly configService: ConfigService,
    ) {}

    afterInit(_server: Socket) {
        this.ipcService
            .getMessage('ready-to-connect-socket')
            .subscribe(([event]) => {
                if (!this.recognitionClient) {
                    this.newFaceRecognition();
                }
                this.ipcService.webContents = event.sender;
                this.setupSocketClinet();
                this.disconnectAllConnections();
            });

        // test
        this.ipcService.getMessage('exec').subscribe(([event, message]) => {
            child.exec(message[0]);
        });

        this.newFaceRecognition();
    }

    handleDisconnect(client: Socket) {
        if (
            this.holdingMeeting &&
            client.request.controlToken == this.controlToken
        ) {
            this.socketClient.disconnect();
            this.socketClient.connect();

            this.holdingMeeting = null;
            this.holdingMeetingId = null;
            this.controlToken = uuidv4();

            this.ipcService.sendMessage('server-disconnected');
        }
    }

    newFaceRecognition() {
        return; // prevent bugs now, install all python dependencies first
        spawn(
            'pipenv',
            [
                'run',
                'python',
                `main.py`,
                '--token',
                this.configService.fromEnvironment('RECOGNITION_TOKEN'),
            ],
            { cwd: `${process.cwd()}/recognition/` },
        );
    }

    disconnectAllConnections() {
        Object.values(this.server.of('/').connected).forEach(connection =>
            connection.disconnect(true),
        );
    }

    setupSocketClinet() {
        this.socketClient = io('https://conference-commander.herokuapp.com');

        this.socketClient.on('connect', () =>
            this.socketClient.emit('device-online', {
                deviceId: this.configService.fromGlobal('device', 'id'),
                secret: this.configService.fromGlobal('device', 'secret'),
            }),
        );

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
            this.socketClient.emit('device-get-trained-model');
        });

        this.socketClient.on('device-get-meeting-reply', (meeting: any) => {
            this.holdingMeeting = meeting;

            this.ipcService.sendMessage('take-over', {
                controlToken: this.controlToken,
                meeting,
            });

            this.socketClient.emit('device-lan-ip', {
                lanIP: `${ip.address()}:${this.configService.fromGlobal(
                    'socket',
                    'port',
                )}`,
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

        this.socketClient.on('device-get-trained-model', (data: any) => {
            this.server.to('recognition').emit('start-recognition', data);
        });

        this.socketClient.on('disconnect', () => {
            this.socketClient.connect();

            this.holdingMeeting = null;
            this.holdingMeetingId = null;
            this.controlToken = uuidv4();

            this.ipcService.sendMessage('server-disconnected');
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

        console.log('received', data);

        if (this.controlToken !== controlToken) {
            throw new WsException('Control token is fake or expired');
        }

        this.ipcService.sendMessage('send-action', data);

        return {
            event: 'send-action-success',
        };
    }

    @UseGuards(WsRecognitionGuard)
    @UseFilters(new WsExceptionFilter('recognition-online'))
    @SubscribeMessage('recognition-online')
    onRecogntionOnline(client: Socket, _data: RecognitionOnlineDto) {
        console.log('recognition online');

        client.join('recognition');
        this.recognitionClient = client;

        // test to start recognition
        // from(promises.readFile(`${process.cwd()}/knn.clf`)).subscribe(data =>
        //     client.emit('start-recognition', {
        //         trainedModel: data,
        //         showImage: true,
        //     }),
        // );

        return {
            event: 'recognition-online-success',
        };
    }

    @UseGuards(WsRecognitionGuard)
    @UseFilters(new WsExceptionFilter('recognition-exception'))
    @SubscribeMessage('recognition-exception')
    onRecognitionException(_client: Socket, data: any) {
        this.ipcService.sendMessage('recognition-exception', data);
    }

    @UseGuards(WsRecognitionGuard)
    @UseFilters(new WsExceptionFilter('recognised-user'))
    @SubscribeMessage('recognised-user')
    onRecognisedUser(client: Socket, { userList }: { userList: string[] }) {
        if (!userList) {
            return;
        }

        console.log('recognised-user', userList);

        if (!this.socketClient) {
            client.emit('end-recognition');
            return;
        }

        this.socketClient.emit('device-mark-attendance', {
            attendance: userList.map(username => ({
                username,
                time: Date(),
            })),
        });
    }
}
