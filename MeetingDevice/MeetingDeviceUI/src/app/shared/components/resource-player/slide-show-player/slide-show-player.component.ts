import {Component, Inject, OnInit} from '@angular/core';
import {ControllableComponent} from '../../controllable/controllable.component';
import {WINDOW_DATA} from '../../../../services/window/window-ref';
import {WindowData} from '../../../../services/window/window-data';
import {GestureActionType} from '../../../enum/control/gesture-action-type';
import {NormalKeys, RobotService} from '../../../../services/robot.service';

@Component({
    selector: 'app-slide-show-player',
    templateUrl: './slide-show-player.component.html',
    styleUrls: ['./slide-show-player.component.css'],
})
export class SlideShowPlayerComponent extends ControllableComponent
    implements OnInit {

    slideUrl: string;

    constructor(
        @Inject(WINDOW_DATA) data: WindowData<SlideShowPlayerComponent>,
        private robot: RobotService
    ) {
        super();
        this.slideUrl = data.data;
    }

    remoteControl(action: string, data: any) {
        switch (action) {
            case GestureActionType.SWIPE_LEFT:
                this.robot.keyDown(NormalKeys.LEFT);
                break;
            case GestureActionType.SWIPE_RIGHT:
                this.robot.keyDown(NormalKeys.RIGHT);
                break;
        }
    }

    ngOnInit() {
    }
}
