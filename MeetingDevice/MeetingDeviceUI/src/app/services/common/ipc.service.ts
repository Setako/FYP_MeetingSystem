import { ChangeDetectorRef, Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';

@Injectable({
    providedIn: 'root',
})
export class IPCService {
    constructor(private readonly electronService: ElectronService) {}

    public static IPC_CHANNEL_DEVICE_CONTROL = 'IPC_CHANNEL_DEVICE_CONTROL';

    private ipcRenderer = this.electronService.ipcRenderer;

    private cdrs: ChangeDetectorRef[] = [];

    public on(channel: string, listener: (event?, args?) => void) {
        this.ipcRenderer.on(channel, (event?, args?) => {
            listener(event, args);
            this.cdrs.forEach(cdr => cdr.detectChanges());
        });
        console.log(this.ipcRenderer);
    }

    public send(channel: string, ...args: any[]) {
        this.ipcRenderer.send(channel, ...args);
    }

    public addCdr(cdr: ChangeDetectorRef) {
        this.cdrs.push(cdr);
    }
}
