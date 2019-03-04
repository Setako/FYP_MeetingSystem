import {Component, Inject, OnInit} from '@angular/core';
import {ControllableComponent} from '../../controllable/controllable.component';
import {WINDOW_DATA} from '../../../../services/window/window-ref';
import {WindowData} from '../../../../services/window/window-data';

@Component({
    selector: 'app-slide-show-player',
    templateUrl: './slide-show-player.component.html',
    styleUrls: ['./slide-show-player.component.css'],
})
export class SlideShowPlayerComponent extends ControllableComponent
    implements OnInit {
    public static REMOTE_ACTION_PREV_PAGE = 0;
    public static REMOTE_ACTION_NEXT_PAGE = 1;

    slideUrl: string;

    constructor(@Inject(WINDOW_DATA) data: WindowData<SlideShowPlayerComponent>) {
        super();
        this.slideUrl = data.data;
    }

    remoteControl(action: number, data: any) {
        switch (action) {
            case SlideShowPlayerComponent.REMOTE_ACTION_NEXT_PAGE:
                break;
            case SlideShowPlayerComponent.REMOTE_ACTION_PREV_PAGE:
                break;
        }
    }

    ngOnInit() {
    }
}
