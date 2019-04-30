import { IPCService } from '../common/ipc.service';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class ControlIpcListenerService {
    constructor(
        private ipcService: IPCService,
    ) {}

    init() {
        this.ipcService.on(
            IPCService.IPC_CHANNEL_DEVICE_CONTROL,
            this.handleControlMessage,
        );
    }

    handleControlMessage(event, arg) {
        console.log(arg);
    }
}
