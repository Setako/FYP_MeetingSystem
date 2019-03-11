import {AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {ControllableComponent} from '../../controllable/controllable.component';
import {WindowData} from '../../../../services/window/window-data';
import {RobotService} from '../../../../services/robot.service';
import {WINDOW_DATA} from '../../../../services/window/window-ref';
import {interval} from 'rxjs';

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
        private robot: RobotService
    ) {
        super();
        this.url = data.data;
        // this.url = 'http://taiko.pui.pm';
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
        console.log(position);
    }

    ngOnInit() {
    }

    ngAfterViewInit(): void {
        interval(500).subscribe(() => this.webContent.nativeElement.focus());
    }
}
