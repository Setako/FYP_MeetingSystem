import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {MatButtonModule, MatIconModule, MatProgressBar, MatProgressBarModule, MatSnackBarModule} from '@angular/material';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {HandGestureMenuComponent} from './hand-gesture-menu/hand-gesture-menu.component';
import {NotificationsContainerComponent} from './main/notifications-container/notifications-container.component';
import {IconNotificationBlockComponent} from './shared/components/notification-block/icon-notification-block.component';
import {NotificationContentComponent} from './shared/components/notification-block/notification-content-component';

@NgModule({
  declarations: [
    AppComponent,
    HandGestureMenuComponent,
    NotificationsContainerComponent,
    IconNotificationBlockComponent,
    NotificationContentComponent
  ],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatIconModule
  ],
  entryComponents: [IconNotificationBlockComponent],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
