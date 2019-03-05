import { Injectable, Optional } from '@nestjs/common';
import { IpcMain, WebContents, Event, ipcMain as main } from 'electron';
import { fromEvent, Observable } from 'rxjs';

@Injectable()
export class CoreService {
    ipcMain = main;

    webContents: any;

    electronGlobal:any = global;

    constructor() // @Optional()
    // public readonly ipcMain: IpcMain = main,
    // @Optional()
    // public webContents: WebContents,
    // @Optional()
    // public readonly electronGlobal: any,
    {}

    sendMessage(channel: string, ...args: any[]) {
        this.webContents.send(channel, ...args);
    }

    getMessage(channel: string): Observable<[Event, any]> {
        return fromEvent(this.ipcMain, channel);
    }
}
