import {AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild, ViewRef} from '@angular/core';
import {ControllableComponent} from '../../../controllable/controllable.component';
import {WINDOW_DATA} from '../../../../../services/window/window-ref';
import {SlideShowPlayerComponent} from '../slide-show-player/slide-show-player.component';
import {WindowData} from '../../../../../services/window/window-data';
import {NormalKeys, RobotService} from '../../../../../services/robot.service';
import {GestureActionType} from '../../../../enum/control/gesture-action-type';
import {interval} from 'rxjs';

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
        switch (direction) {
            case GestureActionType.SWIPE_UP:
                // this.robot.keyDown(NormalKeys.);
                break;
            case GestureActionType.SWIPE_RIGHT:
                // this.robot.keyDown(NormalKeys.LEFT);
                break;
        }
    }

    ngAfterViewInit(): void {
        interval(500).subscribe(() => {
            console.log('focus');
            this.webContent.nativeElement.focus();
        });
    }
}
