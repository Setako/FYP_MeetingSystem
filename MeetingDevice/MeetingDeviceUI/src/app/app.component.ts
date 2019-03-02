import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { ControlIpcListenerService } from './services/control/control-ipc-listener.service';

declare let electron: any;

@Component({
    selector: 'app-root',
    // template: '',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
    title = 'MeetingDeviceUI';

    constructor(
        public snackBar: MatSnackBar,
        private controlIPCListener: ControlIpcListenerService,
    ) {}

    ngOnInit() {
        this.controlIPCListener.init();
    }

    openSnackBar(message: any) {
        // this.snackBar.open(message, null, {duration: 5000});
    }
}
