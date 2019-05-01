import {IPCService} from '../common/ipc.service';
import {Injectable} from '@angular/core';
import {NotificationService} from '../notification/notification.service';
import {SysNotificationColor} from '../../shared/components/notification-block/notification-block.component';
import {IconSysNotification} from '../../shared/components/notification-block/icon-notification-block.component';

@Injectable({
    providedIn: 'root',
})
export class ControlIpcListenerService {
    constructor(
        private ipcService: IPCService,
        private notification: NotificationService
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
