import { Injectable, Optional } from '@nestjs/common';
import { IpcMain, WebContents, Event, ipcMain } from 'electron';
import { fromEvent, Observable } from 'rxjs';

// declare ipcMain

@Injectable()
export class CoreService {
    // ipcMain = main;

    webContents: any;

    electronGlobal: any = global;

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

    getMessage(channel: string, listener: any) {
        ipcMain.on(channel, listener);

        // return fromEvent(ipcMain, channel);
    }
}
