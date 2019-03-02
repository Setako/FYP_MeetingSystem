import {Component, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {MatSnackBar} from '@angular/material';
import {ControlIpcListenerService} from './services/control/control-ipc-listener.service';
import {WindowStackService} from './services/window/window-stack.service';
import {SlideShowPlayerComponent} from './shared/components/resource-player/slide-show-player/slide-show-player.component';

declare let electron: any;

@Component({
    selector: 'app-root',
    // template: '',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
    title = 'MeetingDeviceUI';

    @ViewChild('windowContainer', {read: ViewContainerRef})
    viewContainerRef: ViewContainerRef;

    constructor(
        public snackBar: MatSnackBar,
        private controlIPCListener: ControlIpcListenerService,
        private windowStackService: WindowStackService
    ) {
    }

    ngOnInit() {
        this.controlIPCListener.init();
        this.windowStackService.registerWindowsContainer(this.viewContainerRef);
        this.windowStackService.showWindow(SlideShowPlayerComponent,
            {url: 'https://docs.google.com/presentation/d/1w1o063S3-pA-YVJrflBQ9sQeyjU3UPLnajhru5UbVIw/present'});
    }

    openSnackBar(message: any) {
        // this.snackBar.open(message, null, {duration: 5000});
    }
}
