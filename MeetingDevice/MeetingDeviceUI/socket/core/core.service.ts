import { Injectable } from '@nestjs/common';
import { IpcMain, WebContents, Event } from 'electron';
import { fromEvent, Observable } from 'rxjs';

@Injectable()
export class CoreService {
    constructor(
        public readonly ipcMain: IpcMain,
        public readonly webContents: WebContents,
        public readonly electronGlobal: any,
    ) {}

    sendMessage(channel: string, ...args: any[]) {
        this.webContents.send(channel, ...args);
    }

    getMessage(channel: string): Observable<[Event, any]> {
        return fromEvent(this.ipcMain, channel);
    }
}
