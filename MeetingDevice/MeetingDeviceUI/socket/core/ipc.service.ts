import { Injectable, Optional } from '@nestjs/common';
import { Event, ipcMain as ipc, WebContents, IpcMain } from 'electron';
import { Observable, fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class IpcService {
    webContents: WebContents;

    constructor(@Optional() private readonly ipcMain: IpcMain = ipc) {}

    sendMessage(channel: string, ...args: any[]) {
        if (this.webContents) {
            this.webContents.send(channel, ...args);
        }
    }

    getMessage(channel: string): Observable<[Event, ...any[]]> {
        return fromEvent(this.ipcMain, channel).pipe(
            map(item =>
                Array.isArray(item)
                    ? ([item[0], [...item.splice(1)]] as [Event, ...any[]])
                    : ([item] as [Event]),
            ),
        );
    }
}
