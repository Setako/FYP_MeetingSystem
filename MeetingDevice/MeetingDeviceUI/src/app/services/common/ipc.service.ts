import {Injectable} from '@angular/core';

declare let electron: any;

@Injectable({
    providedIn: 'root',
})
export class IPCService {
    public static IPC_CHANNEL_DEVICE_CONTROL = 'IPC_CHANNEL_DEVICE_CONTROL';
    private ipcRenderer = electron.ipcRenderer;

    public on(channel: string, listener: (event?, args?) => void) {
        this.ipcRenderer.on(channel, listener);
    }

    public send(channel: string, ...args: any[]) {
        this.ipcRenderer.send(channel, ...args);
    }
}
