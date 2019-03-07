import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
} from '@angular/material';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {HandGestureMenuComponent} from './shared/components/hand-gesture-menu/hand-gesture-menu.component';
import {NotificationsContainerComponent} from './main/notifications-container/notifications-container.component';
import {IconNotificationBlockComponent} from './shared/components/notification-block/icon-notification-block.component';
import {NotificationContentComponent} from './shared/components/notification-block/notification-content-component';
import {IPCService} from './services/common/ipc.service';
import {ControlIpcListenerService} from './services/control/control-ipc-listener.service';
import {ControlModeService} from './services/control/control-mode.service';
import {TokenQrcodeWindowComponent} from './shared/components/window/token-qrcode-window/token-qrcode-window.component';
import {QueryingContentHiderComponent} from './shared/components/querying-content-hider/querying-content-hider.component';
import {HttpClientModule} from '@angular/common/http';
import {WebviewDirective} from './shared/directives/WebviewDirective';
import {SlideShowPlayerComponent} from './shared/components/resource-player/slide-show-player/slide-show-player.component';
import {ControllableComponent} from './shared/components/controllable/controllable.component';

import {NgxElectronModule} from 'ngx-electron';
import {WindowComponent} from './shared/components/window/window.component';
import {DocumentPlayerComponent} from './shared/components/resource-player/document-player/document-player.component';
import {VideoPlayerComponent} from './shared/components/resource-player/video-player/video-player.component';
import {ImagePlayerComponent} from './shared/components/resource-player/image-player/image-player.component';
import {AudioPlayerComponent} from './shared/components/resource-player/audio-player/audio-player.component';

@NgModule({
    declarations: [
        AppComponent,
        HandGestureMenuComponent,
        NotificationsContainerComponent,
        IconNotificationBlockComponent,
        NotificationContentComponent,
        TokenQrcodeWindowComponent,
        QueryingContentHiderComponent,
        WebviewDirective,
        SlideShowPlayerComponent,
        ControllableComponent,
        WindowComponent,
        DocumentPlayerComponent,
        VideoPlayerComponent,
        ImagePlayerComponent,
        AudioPlayerComponent,
    ],
    imports: [
        NgxElectronModule,
        BrowserAnimationsModule,
        BrowserModule,
        MatButtonModule,
        MatSnackBarModule,
        MatProgressBarModule,
        MatIconModule,
        MatProgressSpinnerModule,
        HttpClientModule,
    ],
    entryComponents: [
        IconNotificationBlockComponent,
        SlideShowPlayerComponent,
        TokenQrcodeWindowComponent,
        WindowComponent,
        DocumentPlayerComponent,
    ],
    providers: [IPCService, ControlModeService, ControlIpcListenerService],
    bootstrap: [AppComponent],
})
export class AppModule {
}
