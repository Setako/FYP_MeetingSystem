import {AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {ControllableComponent} from '../../controllable/controllable.component';
import {WindowData} from '../../../../services/window/window-data';
import {ModifierKeys, RobotService} from '../../../../services/robot.service';
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

    constructor(
        @Inject(WINDOW_DATA) data: WindowData<ImagePlayerComponent>,
        private robot: RobotService,
        private ipc: IPCService
    ) {
        super();
        this.url = data.data;
    }

    @ViewChild('webContent')
    webContent: ElementRef;
    url: string;

    private currentScaleFactor = 1;
    private targetScaleFactor = 1.0;

    remoteControl(data: any) {
        switch (data.type) {
            case 'scroll':
                this.move(data.distance[0], data.distance[1]);
                break;
            case 'scale':
                this.scale(data.scaleFactor);
                break;
        }
    }

    private scale(scaleFactor: number) {
        // over 2 because it is too hard to control
        this.targetScaleFactor = (this.targetScaleFactor * (scaleFactor)) / 2 + this.targetScaleFactor / 2;
        this.targetScaleFactor = Math.max(1, Math.min(this.targetScaleFactor, 4));

        const scaling = Math.floor(this.targetScaleFactor - this.currentScaleFactor);

        this.currentScaleFactor += scaling;

        for (let i = 0; i < Math.abs(scaling); i++) {
            if (scaling > 0) {
                this.robot.keyDown('=');
            } else {
                this.robot.keyDown('-');
            }
        }
    }

    private move(x: number, y: number) {
        // todo: move
        this.robot.setMouseDelay(1);
        this.robot.moveMouse(50, 50);
        this.robot.mouseToggle('down');
        this.robot.dragMouse(this.range(0, 50 + x * 5, 100), this.range(0, 50 + y * 5, 100));
        this.robot.mouseToggle('up');
    }

    private range(min: number, value: number, max: number): number {
        return Math.min(max, Math.max(min, value));
    }


    ngOnInit() {
    }

    ngAfterViewInit(): void {
    }
}
