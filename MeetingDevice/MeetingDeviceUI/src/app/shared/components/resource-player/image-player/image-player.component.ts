import {AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {ControllableComponent} from '../../controllable/controllable.component';
import {WindowData} from '../../../../services/window/window-data';
import {RobotService} from '../../../../services/robot.service';
import {WINDOW_DATA} from '../../../../services/window/window-ref';
import {interval} from 'rxjs';
import {IPCService} from '../../../../services/common/ipc.service';

@Component({
    selector: 'app-image-player',
    templateUrl: './image-player.component.html',
    styleUrls: ['./image-player.component.css']
})
export class ImagePlayerComponent extends ControllableComponent
    implements OnInit, AfterViewInit {
    @ViewChild('webContent')
    webContent: ElementRef;
    url: string;

    constructor(
        @Inject(WINDOW_DATA) data: WindowData<ImagePlayerComponent>,
        private robot: RobotService,
        private ipc: IPCService
    ) {
        super();
        // this.url = data.data;
        this.url = 'http://taiko.bui.pm';
    }

    remoteControl(data: any) {
        console.log(data.type);
        switch (data.type) {
            case 'down':
                this.tap(data.position);
                break;
        }
    }

    tap(position: number[]) {
        if (position[0] < 450) {
            this.ipc.send('exec', 'xdotool keydown d sleep 0.05 keyup d');
        } else if (position[0] >= 450 && position[0] < 900) {
            this.ipc.send('exec', 'xdotool keydown f sleep 0.05 keyup f');
        } else if (position[0] >= 900 && position[0] < 1350) {
            this.ipc.send('exec', 'xdotool keydown j sleep 0.05 keyup j');
        } else if (position[0] >= 1350 && position[0] < 1800) {
            this.ipc.send('exec', 'xdotool keydown k sleep 0.05 keyup k');
        }
    }

    ngOnInit() {
    }

    ngAfterViewInit(): void {
        interval(500).subscribe(() => this.webContent.nativeElement.focus());
    }
}
