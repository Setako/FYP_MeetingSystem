import {AfterViewInit, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ControllableComponent} from '../../../controllable/controllable.component';
import {WindowData} from '../../../../../services/window/window-data';
import {RobotService} from '../../../../../services/robot.service';
import {WINDOW_DATA} from '../../../../../services/window/window-ref';
import {IPCService} from '../../../../../services/common/ipc.service';
import {interval} from 'rxjs';

@Component({
    selector: 'app-image-player',
    templateUrl: './image-player.component.html',
    styleUrls: ['./image-player.component.css']
})
export class ImagePlayerComponent extends ControllableComponent
    implements OnInit, AfterViewInit, OnDestroy {

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

    moving = false;
    lastMoveTime = 0; // prevent quick move cause double click zoom

    private currentScaleFactor = 1;
    private targetScaleFactor = 1;

    remoteControl(data: any) {
        switch (data.type) {
            case 'scroll':
                this.move((data.fromPosition[0] - data.toPosition[0]) / 3, (data.fromPosition[1] - data.toPosition[1]) / 3);
                break;
            case 'scale':
                this.scale(data.scaleFactor);
                break;
            case 'up':
                this.resetMouse();
                break;
        }
    }

    private scale(scaleFactor: number) {
        // over 2 because it is too hard to control
        this.targetScaleFactor = (this.targetScaleFactor * (scaleFactor)) / 4 + this.targetScaleFactor * 3 / 4;
        this.targetScaleFactor = Math.max(1, Math.min(this.targetScaleFactor, 5));

        const scaling = Math.floor(this.targetScaleFactor - this.currentScaleFactor);

        this.currentScaleFactor += scaling;

        for (let i = 0; i < Math.abs(scaling); i++) {
            this.robot.setKeyboardDelay(3);
            if (scaling > 0) {
                this.robot.keyDown('=');
            } else {
                this.robot.keyDown('-');
            }
        }
    }

    private move(x: number, y: number) {
        if (Math.random() < 0.25) { // decrease change rate
            return;
        }
        if (this.currentScaleFactor <= 1) {
            this.resetMouse();
            return;
        }
        this.robot.setMouseDelay(1);
        if (!this.moving) {
            if (this.lastMoveTime + 500 < new Date().getTime()) {
                this.lastMoveTime = new Date().getTime();
                this.robot.moveMouse(50, 50);
                this.robot.mouseToggle('down');
                this.moving = true;
                this.robot.dragMouse(this.range(10, 50 - x * 5, 90), this.range(10, 50 - y * 5, 90));
            }
        } else {
            this.robot.dragMouse(this.range(10, 50 - x * 5, 90), this.range(10, 50 - y * 5, 90));
        }
    }

    private resetMouse() {
        this.moving = false;
        this.robot.mouseToggle('up');
        this.robot.moveMouse(100, 100);
    }

    private range(min: number, value: number, max: number): number {
        return Math.min(max, Math.max(min, value));
    }


    ngOnInit() {
    }

    ngAfterViewInit(): void {
        interval(500).subscribe(() => {
            console.log('focus');
            this.webContent.nativeElement.focus();
        });
    }

    ngOnDestroy(): void {
    }


}
