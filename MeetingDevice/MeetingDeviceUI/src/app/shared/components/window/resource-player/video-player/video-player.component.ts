import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {ControllableComponent} from '../../../controllable/controllable.component';
import {WINDOW_DATA} from '../../../../../services/window/window-ref';
import {WindowData} from '../../../../../services/window/window-data';
import {NormalKeys, RobotService} from '../../../../../services/robot.service';
import WebviewTag = Electron.WebviewTag;

@Component({
    selector: 'app-video-player',
    templateUrl: './video-player.component.html',
    styleUrls: ['./video-player.component.css']
})
export class VideoPlayerComponent extends ControllableComponent
    implements OnInit, AfterViewInit {

    constructor(
        @Inject(WINDOW_DATA) data: WindowData<VideoPlayerComponent>,
        private robot: RobotService,
        private cdr: ChangeDetectorRef,
    ) {
        super();
        this.url = data.data;
    }

    @ViewChild('webContent')
    webContent: ElementRef<WebviewTag>;


    public loaded = false;

    public moveAccumulation = 0;

    url: string;

    private static getDistanceRate(moveDistance: number): number {
        const x = moveDistance / 100 * 4;
        console.log(`${moveDistance} x ${((0.3 * Math.pow(x - 2, 2) + (x - 2) + 1) / 4 * 100)} = ${moveDistance * ((0.25 * Math.pow(x - 2, 2) + (x - 2) + 1) / 4 * 100)}`);
        return moveDistance * Math.max(0.2, ((0.3 * Math.pow(x - 2, 2) + (x - 2) + 1) / 4 * 100));
    }

    remoteControl(data: any) {
        if (this.loaded) {
            switch (data.type) {
                case 'singleTapUp':
                    this.playPause();
                    break;
                case 'scroll':
                    this.move(data.distance[0]);
                    break;
                case 'up':
                    this.moveAccumulation = 0;
                    break;
            }
        }
    }

    ngOnInit() {
        this.webContent.nativeElement.addEventListener('did-finish-load', () => {
            this.loaded = true;
            this.cdr.detectChanges();
            this.webContent.nativeElement.focus();
            this.robot.setMouseDelay(1);
            this.robot.keyDown(NormalKeys.SPACE);
            this.robot.keyDown('f');
            this.robot.moveMouse(50, 50);
            this.robot.mouseClick();
            this.robot.moveMouse(100, 100);
        });
    }


    playPause() {
        this.robot.keyDown(NormalKeys.SPACE);
    }

    ngAfterViewInit(): void {
        // interval(500).subscribe(() => {
        //     this.webContent.nativeElement.focus();
        // });
    }

    move(distance: number) {
        const step = 5;
        console.log(VideoPlayerComponent.getDistanceRate(distance));
        this.moveAccumulation += VideoPlayerComponent.getDistanceRate(distance);
        const timeMove = Math.round(this.moveAccumulation / step);
        this.robot.setKeyboardDelay(0);
        for (let i = 0; i < Math.abs(timeMove); i++) {
            this.robot.keyDown(timeMove > 0 ? NormalKeys.RIGHT : NormalKeys.LEFT);
        }
        this.robot.setKeyboardDelay(10);
        this.moveAccumulation -= timeMove * step;
    }
}
