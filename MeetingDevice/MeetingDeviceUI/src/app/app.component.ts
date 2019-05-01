import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ComponentFactory,
    ComponentRef,
    Injector,
    NgZone,
    OnInit,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';
import {MatSnackBar} from '@angular/material';
import {ControlIpcListenerService} from './services/control/control-ipc-listener.service';
import {WindowStackService} from './services/window/window-stack.service';
import {ElectronService} from 'ngx-electron';
import {RobotService} from './services/robot.service';
import {IPCService} from './services/common/ipc.service';
import {MeetingStateHolderService} from './services/interact/meeting-state-holder.service';
import {ActionReceiverService} from './services/interact/action-receiver.service';
import {ResourceOpenerService} from './services/interact/resource-opener.service';
import {LaserHandlerService} from './services/control/laser-handler.service';

declare let electron: any;

@Component({
    selector: 'app-root',
    // template: '',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, AfterViewInit {
    title = 'MeetingDeviceUI';

    @ViewChild('windowContainer', {read: ViewContainerRef})
    viewContainerRef: ViewContainerRef;

    constructor(
        private cdr: ChangeDetectorRef,
        public snackBar: MatSnackBar,
        private controlIPCListener: ControlIpcListenerService,
        private windowStackService: WindowStackService,
        private readonly electronService: ElectronService,
        private readonly robotService: RobotService,
        private ipcService: IPCService,
        private actionReceiver: ActionReceiverService,
        private meetingStateHolderService: MeetingStateHolderService,
        readonly laserHandler: LaserHandlerService,
        private readonly resourceOpener: ResourceOpenerService,
        private ngZone: NgZone
    ) {
        ipcService.addCdr(cdr);
    }

    ngOnInit() {
        setInterval(() => {
            this.ngZone.run(() => this.cdr.detectChanges());
        });
        this.laserHandler.setListener(() => this.cdr.detectChanges());
        this.controlIPCListener.init();
        this.windowStackService.registerWindowsContainer(this);

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
    }

    createComponent<C>(
        componentFactory: ComponentFactory<C>,
        index?: number,
        injector?: Injector,
    ): ComponentRef<C> {
        return this.viewContainerRef.createComponent(
            componentFactory,
            index,
            injector,
        );
    }

    ngAfterViewInit(): void {
        this.ipcService.send('ready-to-connect-socket');
    }

    openSnackBar(message: any) {
        // this.snackBar.open(message, null, {duration: 5000});
    }
}
