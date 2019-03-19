import {AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {ControllableComponent} from '../../controllable/controllable.component';
import {WINDOW_DATA} from '../../../../services/window/window-ref';
import {WindowData} from '../../../../services/window/window-data';
import {NormalKeys, RobotService} from '../../../../services/robot.service';
import {interval} from 'rxjs';
import webviewTag = Electron.webviewTag;

@Component({
    selector: 'app-video-player',
    templateUrl: './video-player.component.html',
    styleUrls: ['./video-player.component.css']
})
export class VideoPlayerComponent extends ControllableComponent
    implements OnInit, AfterViewInit {
    @ViewChild('webContent')
    webContent: ElementRef;


    url: string;

    constructor(
        @Inject(WINDOW_DATA) data: WindowData<VideoPlayerComponent>,
        private robot: RobotService
    ) {
        super();
        this.url = data.data;
    }

    remoteControl(data: any) {
        console.log(data.type);
        switch (data.type) {
            case 'singleTapUp':
                this.playPause();
                break;
        }
    }

    ngOnInit() {
        webviewTag.addEventListener('did-finish-load', () => {
            interval(100).subscribe(() => {
                this.robot.keyDown('f');
                this.webContent.nativeElement.focus();
            });
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
}
