import {IPCService} from '../common/ipc.service';
import {ControlModeService} from './control-mode.service';
import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class ControlIpcListenerService {
    constructor(
        private ipcService: IPCService,
        private controlModeService: ControlModeService,
    ) {
    }

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
