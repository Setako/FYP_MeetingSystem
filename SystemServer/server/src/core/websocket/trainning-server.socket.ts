import { Injectable, OnModuleInit } from '@nestjs/common';
import io from 'socket.io-client';
import { FaceService } from '../user/face.service';
import { delayWhen, filter, flatMap, map } from 'rxjs/operators';
import { of, interval, merge, Observable, fromEvent } from 'rxjs';
import { FaceStatus } from '../user/face.model';
import { documentToPlain } from '@commander/shared/operator/document';
import { FaceDto } from './dto/face.dto';
import { skipFalsy } from '@commander/shared/operator/function';

@Injectable()
export class TrainningServerSocket implements OnModuleInit {
    private socket: SocketIOClient.Socket;

    private readonly trainningServerUri: string;
    private readonly trainningServerToken: string;

    private isConnected: boolean;

    constructor(private readonly faceService: FaceService) {
        this.trainningServerUri = process.env.TRAINNING_SERVER_URI;
        this.trainningServerToken = process.env.TRAINNING_SERVER_TOKEN;

        this.isConnected = false;
    }

    onModuleInit() {
        this.socket = io(this.trainningServerUri, {
            transports: ['websocket'],
            forceNew: false,
        });

        this.socket.on('connect', () => {
            console.info(`[Trainning Server] - ${new Date()} connect`);
            this.socket.emit('auth', {
                token: this.trainningServerToken,
            });
        });

        this.socket.on('disconnect', () => {
            console.info(`[Trainning Server] - ${new Date()} disconnect`);
            this.isConnected = false;
        });

        this.socket.on('reconnect', () => {
            console.info(`[Trainning Server] - ${new Date()} reconnect`);
            this.faceService
                .find({
                    status: FaceStatus.Waiting,
                })
                .pipe(
                    documentToPlain(FaceDto),
                    delayWhen(() =>
                        this.isConnected
                            ? of(undefined)
                            : interval(100).pipe(
                                  filter(() => this.isConnected),
                              ),
                    ),
                )
                .subscribe(face => this.socket.emit('train', face));
        });

        this.socket.on('exception', (data: any) => {
            console.error(`Trainning Server Socket Error:`, data);
        });

        this.socket.on('auth_result', (data: any) => {
            this.isConnected = data && data.success;
        });

        this.socket.on('train_result', ({ id, valid, resultPath }) => {
            this.faceService
                .getByid(id)
                .pipe(
                    flatMap(item => {
                        if (valid) {
                            item.status = FaceStatus.Trained;
                            item.resultPath = resultPath;
                        } else {
                            item.status = FaceStatus.Invalid;
                        }

                        return item.save();
                    }),
                )
                .subscribe();
        });

        const onStart$ = this.faceService.find({
            status: FaceStatus.Waiting,
        });

        const onSave$ = this.faceService.watchModelSave().pipe(
            filter(item => item.status === FaceStatus.Waiting),
            flatMap(item => this.faceService.getByid(item.id)),
            skipFalsy(),
            filter(item => item.status === FaceStatus.Waiting),
        );

        merge(onStart$, onSave$)
            .pipe(
                documentToPlain(FaceDto),
                delayWhen(() =>
                    this.isConnected
                        ? of(undefined)
                        : interval(100).pipe(filter(() => this.isConnected)),
                ),
            )
            .subscribe(face => this.socket.emit('train', face));
    }

    emit(event: string, ...data: any[]) {
        return of(true).pipe(
            delayWhen(() =>
                this.socket.connected
                    ? of(undefined)
                    : interval(100).pipe(filter(() => this.socket.connected)),
            ),
            map(() => this.socket.emit(event, ...data)),
        );
    }

    on<T = any>(event: string): Observable<T> {
        return fromEvent(this.socket, event);
    }
}
