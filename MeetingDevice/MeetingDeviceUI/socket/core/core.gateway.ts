import { UseFilters, UseGuards, UsePipes, HttpService } from '@nestjs/common';
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
import { spawn, exec } from 'child_process';
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
        private readonly httpService: HttpService,
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
        this.ipcService.getMessage('exec').subscribe(([, message]) => {
            exec(message[0]);
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
        if (
            this.configService.fromEnvironment('DISABLE_FACE_RECOGNITION') !=
            'false'
        ) {
            return;
        }

        const cwd = `${process.cwd()}/recognition/`;
        const pythonPath =
            this.configService.fromEnvironment('PYTHON_PATH') || 'python3';
        const recognition = spawn(
            pythonPath,
            [
                'main.py',
                '--token',
                this.configService.fromEnvironment('RECOGNITION_TOKEN'),
                '--port',
                this.configService.fromGlobal('socket', 'port'),
            ],
            { cwd },
        );

        recognition.stdout.on('data', data =>
            console.log(
                `[Recognition] stdout - ${new Date()}`,
                data.toString(),
            ),
        );
        recognition.stderr.on('data', data =>
            console.log(
                `[Recognition] stderr - ${new Date()}`,
                data.toString(),
            ),
        );
    }

    disconnectAllConnections() {
        Object.values(this.server.of('/').connected).forEach(connection =>
            connection.disconnect(true),
        );
    }

    setupSocketClinet() {
        if (this.socketClient) {
            this.socketClient.removeAllListeners();
            this.socketClient.disconnect();
        }

        this.socketClient = io(
            this.configService.fromEnvironment('SERVER_URL'),
            {
                transports: ['websocket', 'polling'],
                forceNew: true,
            },
        );

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

        this.socketClient.on(
            'device-get-trained-model-reply',
            ({ link, timeout, fitModelUser }) => {
                if ((fitModelUser as string[]).length === 0) {
                    this.ipcService.sendMessage('failed-recognition', {
                        reason: 'no one has enough facial data',
                        fitModelUser,
                    });
                    return;
                }
                if (new Date(timeout) < new Date()) {
                    this.socketClient.emit('device-get-trained-model');
                    return;
                }

                this.httpService
                    .get(link, { responseType: 'arraybuffer' })
                    .subscribe(res => {
                        this.server
                            .to('recognition')
                            .emit('start-recognition', {
                                trainedModel: res.data,
                                showImage: this.configService.fromEnvironment('RECOGNITION_SHOW_IMAGE') === 'true',
                            });

                        this.ipcService.sendMessage('start-recognition', {
                            fitModelUser,
                        });
                    });
            },
        );

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
            if (this.holdingMeeting) {
                this.holdingMeeting.attendance = data;
            }
            this.ipcService.sendMessage('attendance-updated', data);
        });

        this.socketClient.on('client-end-meeting', () => {
            this.socketClient.disconnect();
            this.socketClient.connect();

            this.holdingMeeting = null;
            this.holdingMeetingId = null;
            this.controlToken = uuidv4();

            this.server.to('recognition').emit('end-recognition');

            this.ipcService.sendMessage('server-disconnected');
        });

        this.socketClient.on('disconnect', () => {
            this.holdingMeeting = null;
            this.holdingMeetingId = null;
            this.controlToken = uuidv4();

            this.server.to('recognition').emit('end-recognition');

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
    onRecognisedUser(client: Socket, { userIdList }: { userIdList: string[] }) {
        if (!userIdList || !userIdList.length) {
            return;
        }

        if (!this.socketClient) {
            client.emit('end-recognition');
            return;
        }

        if (this.holdingMeeting) {
            const notArrivalUserIds = Array.from<any>(
                this.holdingMeeting.attendance,
            )
                .filter(item => !item.arrivalTime)
                .map(item => item.user.id);

            const data = userIdList
                .filter(id => {
                    // console.log(
                    //     id,
                    //     notArrivalUserIds,
                    //     notArrivalUserIds.includes(id),
                    // );
                    return notArrivalUserIds.includes(id);
                })
                .map(userId => ({
                    userId,
                    time: Date(),
                }));

            if (data.length === 0) return;

            console.log('recognised-user', data);

            this.ipcService.sendMessage('recognised-user', {
                userIds: data.map(item => item.userId),
            });

            this.socketClient.emit('device-mark-attendance', {
                attendance: data,
            });
        }
    }
}
