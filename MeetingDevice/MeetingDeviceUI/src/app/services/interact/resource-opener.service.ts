import {Injectable, Type} from '@angular/core';
import {WindowStackService} from '../window/window-stack.service';
import {SlideShowPlayerComponent} from '../../shared/components/resource-player/slide-show-player/slide-show-player.component';
import {DocumentPlayerComponent} from '../../shared/components/resource-player/document-player/document-player.component';
import {ControllableComponent} from '../../shared/components/controllable/controllable.component';
import {AudioPlayerComponent} from '../../shared/components/resource-player/audio-player/audio-player.component';
import {ImagePlayerComponent} from '../../shared/components/resource-player/image-player/image-player.component';
import {VideoPlayerComponent} from '../../shared/components/resource-player/video-player/video-player.component';
import {UnsupportedTypeComponent} from '../../shared/components/resource-player/unsupported-type/unsupported-type.component';

@Injectable({
    providedIn: 'root'
})
export class ResourceOpenerService {
    private typeMap: { [type: string]: Type<ControllableComponent> } = {
        'application/vnd.google-apps.presentation': SlideShowPlayerComponent,
        'application/vnd.google-apps.document': DocumentPlayerComponent,
        'application/vnd.google-apps.audio': AudioPlayerComponent,
        'application/vnd.google-apps.photo': ImagePlayerComponent,
        // 'application/vnd.google-apps.spreadsheet',
        'application/vnd.google-apps.video': VideoPlayerComponent,
    };

    private prefixMap: { [mimePrefix: string]: Type<ControllableComponent> } = {
        'image/': ImagePlayerComponent,
        'audio/': AudioPlayerComponent,
        'video/': VideoPlayerComponent
    };

    constructor(private windowStack: WindowStackService) {

    }

    open(type: string, url: string) {
        const windowType: Type<ControllableComponent> = this.typeMap[type] != null ? this.typeMap[type] : this.checkGenericFileType(type);
        this.windowStack.showWindow({
            type: windowType != null ? windowType : UnsupportedTypeComponent,
            data: url
        });
    }

    checkGenericFileType(mime: string): Type<ControllableComponent> {
        const matching = Object.keys(this.prefixMap).filter((prefix) => mime.startsWith(prefix));
        if (matching.length > 1) {
            console.warn(`More than one mime file prefix matching, ${mime} match with [${matching.join(', ')}]`);
        }
        return matching.length > 0 ? this.prefixMap[matching[0]] : null;
    }
}
