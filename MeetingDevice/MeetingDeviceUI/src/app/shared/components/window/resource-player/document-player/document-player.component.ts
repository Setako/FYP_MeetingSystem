import {AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {ControllableComponent} from '../../../controllable/controllable.component';
import {WINDOW_DATA} from '../../../../../services/window/window-ref';
import {WindowData} from '../../../../../services/window/window-data';
import {RobotService} from '../../../../../services/robot.service';
import {GestureActionType} from '../../../../enum/control/gesture-action-type';

@Component({
    selector: 'app-document-player',
    templateUrl: './document-player.component.html',
    styleUrls: ['./document-player.component.css']
})
export class DocumentPlayerComponent extends ControllableComponent implements OnInit, AfterViewInit {
    @ViewChild('webContent')
    webContent: ElementRef;


    slideUrl: string;

    constructor(
        @Inject(WINDOW_DATA) data: WindowData<DocumentPlayerComponent>,
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
        this.robot.setMouseDelay(5);
        this.robot.moveMouse(0, 50);
        this.robot.mouseClick();
        switch (direction) {
            case GestureActionType.SWIPE_UP:
                this.robot.keyDown('pageup');
                break;
            case GestureActionType.SWIPE_DOWN:
                this.robot.keyDown('pagedown');
                break;
        }
    }

    ngAfterViewInit(): void {
        // interval(500).subscribe(() => {
        //     this.webContent.nativeElement.focus();
        // });
    }
}
