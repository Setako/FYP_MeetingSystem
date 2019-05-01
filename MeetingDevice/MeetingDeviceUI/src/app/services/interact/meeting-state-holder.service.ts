import {Injectable} from '@angular/core';
import {IPCService} from '../common/ipc.service';
import {WindowStackService} from '../window/window-stack.service';
import {MatSnackBar} from '@angular/material';
import {TokenQrcodeWindowComponent} from '../../shared/components/window/token-qrcode-window/token-qrcode-window.component';
import {IconSysNotification} from '../../shared/components/notification-block/icon-notification-block.component';
import {SysNotificationColor} from '../../shared/components/notification-block/notification-block.component';
import {NotificationService} from '../notification/notification.service';

@Injectable({
    providedIn: 'root',
})
export class MeetingStateHolderService {
    private currentMeeting = null;
    private lastDcTime = 0;

    constructor(
        ipc: IPCService,
        readonly windowStackService: WindowStackService,
        readonly snackBar: MatSnackBar,
        private notification: NotificationService
    ) {
        ipc.on('show-token', (event, data: { accessToken: string }) =>
            this.showToken(data.accessToken),
        );

        ipc.on(
            'take-over',
            (event, data: { controlToken: string; meeting: any }) =>
                this.takeOver(data.meeting),
        );

        ipc.on('server-disconnected', () => this.disconnected());

        ipc.on('server-exception', (event, data: any) => {
            snackBar.open('Server exception catched', 'Dismiss', {
                duration: 4000,
            });
            console.log('server-exception', data);
        });

        ipc.on('start-recognition', () => this.startRecog());
        ipc.on('recognised-user', (event, data) => {
            this.userRecog(data.userIds);
        });

    }

    private disconnected() {
        if (new Date().getTime() > this.lastDcTime + 1000) {
            this.notification.addNotification(new IconSysNotification(SysNotificationColor.SUCCESS, 'Disconnected',
                [
                    `Device disconnected with the apps`
                ], 'mobile_off'));
        }
        this.lastDcTime = new Date().getTime();
        this.windowStackService.closeAllWindow();
    }

    private showToken(accessToken: string) {
        this.currentMeeting = null;
        this.windowStackService.showWindow({
            type: TokenQrcodeWindowComponent,
            data: accessToken,
        });
    }

    private takeOver(meeting: any) {
        this.notification.addNotification(new IconSysNotification(SysNotificationColor.SUCCESS, 'Connected successfully',
            [
                `Meeting binded: ${meeting.title}`,
                `You can use the apps to control it now`,
            ], 'mobile_friendly'));
        this.windowStackService.closeAllWindow();
    }

    private userRecog(userIds: string[]) {
        console.log(userIds);
        this.currentMeeting.attendance
            .map(attendance => attendance.user)
            .filter(user => userIds.indexOf(user.id) > -1)
            .forEach((user) => {
                console.log('recognized:' + user.id);
                this.notification.addNotification(new IconSysNotification(SysNotificationColor.SUCCESS, 'Attendance recorded',
                    [
                        `Attendee recognized: ${user.displayName}`
                    ], 'done'));
            });
    }

    private startRecog() {
        console.log('start recog');
        this.notification.addNotification(new IconSysNotification(SysNotificationColor.SUCCESS, 'Face recognition initialized',
            [
                'Face recognition is now available'
            ], 'face'));
    }
}
