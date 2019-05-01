import {AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {ControllableComponent} from '../../../controllable/controllable.component';
import {WINDOW_DATA} from '../../../../../services/window/window-ref';
import {WindowData} from '../../../../../services/window/window-data';
import {GestureActionType} from '../../../../enum/control/gesture-action-type';
import {NormalKeys, RobotService} from '../../../../../services/robot.service';

@Component({
    selector: 'app-slide-show-player',
    templateUrl: './slide-show-player.component.html',
    styleUrls: ['./slide-show-player.component.css'],
})
export class SlideShowPlayerComponent extends ControllableComponent
    implements OnInit, AfterViewInit {
    @ViewChild('webContent')
    webContent: ElementRef;


    slideUrl: string;

    constructor(
        @Inject(WINDOW_DATA) data: WindowData<SlideShowPlayerComponent>,
        private robot: RobotService
    ) {
        super();
        this.slideUrl = data.data;
    }

    remoteControl(data: any) {
        console.log(data.type);
        switch (data.type) {
            case 'swipe':
                this.swipe(data.direction);
                break;
        }
    }

    ngOnInit() {
    }


    swipe(direction: string) {
        switch (direction) {
            case GestureActionType.SWIPE_LEFT:
                this.robot.setMouseDelay(5);
                this.robot.moveMouse(50, 50);
                this.robot.mouseClick();
                this.robot.moveMouse(100, 0);
                break;
            case GestureActionType.SWIPE_RIGHT:
                this.robot.keyDown(NormalKeys.LEFT);
                break;
        }
    }

    ngAfterViewInit(): void {
        // interval(500).subscribe(() => {
        //     this.webContent.nativeElement.focus();
        // });
    }
}
