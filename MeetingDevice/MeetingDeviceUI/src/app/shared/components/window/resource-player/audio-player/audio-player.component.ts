import {AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {ControllableComponent} from '../../../controllable/controllable.component';
import {WINDOW_DATA} from '../../../../../services/window/window-ref';
import {WindowData} from '../../../../../services/window/window-data';
import {RobotService} from '../../../../../services/robot.service';
import {interval} from 'rxjs';

@Component({
    selector: 'app-audio-player',
    templateUrl: './audio-player.component.html',
    styleUrls: ['./audio-player.component.css']
})
export class AudioPlayerComponent extends ControllableComponent
    implements OnInit, AfterViewInit {
    @ViewChild('webContent')
    webContent: ElementRef;
    url: string;

    constructor(
        @Inject(WINDOW_DATA) data: WindowData<AudioPlayerComponent>,
        private robot: RobotService
    ) {
        super();
        this.url = data.data;
    }

    remoteControl(data: any) {
    }

    ngOnInit() {
    }

    ngAfterViewInit(): void {
        interval(500).subscribe(() => this.webContent.nativeElement.focus());
    }
}
