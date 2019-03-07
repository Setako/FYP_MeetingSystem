import {Injectable, Type} from '@angular/core';
import {WindowStackService} from '../window/window-stack.service';
import {SlideShowPlayerComponent} from '../../shared/components/resource-player/slide-show-player/slide-show-player.component';
import {DocumentPlayerComponent} from '../../shared/components/resource-player/document-player/document-player.component';
import {ControllableComponent} from '../../shared/components/controllable/controllable.component';

@Injectable({
    providedIn: 'root'
})
export class ResourceOpenerService {
    private typeMap: { [type: string]: Type<ControllableComponent> } = {
        'application/vnd.google-apps.presentation': SlideShowPlayerComponent,
        'application/vnd.google-apps.document': DocumentPlayerComponent,
    };

    constructor(private windowStack: WindowStackService) {

    }

    open(type: string, url: string) {
        this.windowStack.showWindow({
            type: this.typeMap[type],
            data: url
        });
    }
}
