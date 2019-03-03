import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { ControlIpcListenerService } from './services/control/control-ipc-listener.service';
import { WindowStackService } from './services/window/window-stack.service';
import { SlideShowPlayerComponent } from './shared/components/resource-player/slide-show-player/slide-show-player.component';
import { ElectronService } from 'ngx-electron';
import { IPCService } from './services/common/ipc.service';
import { RobotService, NormalKeys } from './services/robot.service';

declare let electron: any;

@Component({
    selector: 'app-root',
    // template: '',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
    title = 'MeetingDeviceUI';

    @ViewChild('windowContainer', { read: ViewContainerRef })
    viewContainerRef: ViewContainerRef;

    constructor(
        public snackBar: MatSnackBar,
        private controlIPCListener: ControlIpcListenerService,
        private windowStackService: WindowStackService,
        private readonly electronService: ElectronService,
        private readonly robotService: RobotService,
    ) {}

    ngOnInit() {
        this.controlIPCListener.init();
        this.windowStackService.registerWindowsContainer(this.viewContainerRef);
        this.windowStackService.showWindow(SlideShowPlayerComponent, {
            url:
                'https://docs.google.com/presentation/d/1j77Ah9lFS_KlmWejBTJRimDPgy87W2s7xuApJ4lv9lg/present',
        });

        // 1. tell socket that it is ready to connect
        this.electronService.ipcRenderer.send('ready-to-connect-socket');

        // 2. list of event
        this.electronService.ipcRenderer.on(
            'show-token',
            (event: any, data: { accessToken: string }) => {
                console.log('show-token', data);

                // 'console.log'
                //     .split('')
                //     .forEach(item => this.robotService.keyDown(item));

                // this.robotService.keyDown('9', [NormalKeys.SHIFT]);
                // "'hello world'"
                //     .split('')
                //     .forEach(item => this.robotService.keyDown(item));
                // this.robotService.keyDown('0', [NormalKeys.SHIFT]);

                // this.robotService.keyDown(NormalKeys.ENTER);
            },
        );

        this.electronService.ipcRenderer.on(
            'take-over',
            (event: any, data: { controlToken: string; meetingId: string }) => {
                console.log('take-over', data);
            },
        );

        this.electronService.ipcRenderer.on(
            'attendance-updated',
            (
                event: any,
                data: {
                    attendance: {
                        user: {
                            username: string;
                            email: string;
                            displayName: string;
                        };
                        priority?: number;
                        arrivalTime?: number;
                        status?: string;
                        permission?: {
                            accessShareResources: boolean;
                            accessRecordedVoice: boolean;
                            accessTextRecordOfSpeech: boolean;
                            accessAttendanceRecord: boolean;
                            makeMeetingMinute: boolean;
                            reviewMeetingMinute: boolean;
                        };
                    }[];
                },
            ) => {
                console.log('attendance-updated', data);
            },
        );

        this.electronService.ipcRenderer.on('server-disconnected', () => {
            console.log('server-disconnected');
        });

        this.electronService.ipcRenderer.on('server-exception', (data: any) => {
            console.log('server-exception', data);
        });

        this.electronService.ipcRenderer.on(
            'send-action',
            (event: any, data: any) => {
                console.log('send-action', data);
            },
        );
    }

    openSnackBar(message: any) {
        // this.snackBar.open(message, null, {duration: 5000});
    }
}
