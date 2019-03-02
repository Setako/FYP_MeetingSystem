import {NotificationBlockComponent, SysNotification, SysNotificationColor,} from './notification-block.component';
import {Component} from '@angular/core';

@Component({
    selector: 'app-icon-notification-block',
    template: `
        <div
            *ngIf="notification"
            class="mat-elevation-z4"
            style="position:relative;padding: 10px; width: 300px; background: white; "
        >
            <div
                style="display: inline-block; vertical-align: middle; padding-left: 10px;padding-right: 10px"
            >
                <mat-icon>{{ notification.icon }}</mat-icon>
            </div>
            <div style="display: inline-block;vertical-align: middle;">
                <h3>{{ notification.title }}</h3>
                {{ notification.messages }}
            </div>
        </div>
    `,
})
export class IconNotificationBlockComponent extends NotificationBlockComponent {
    notification: IconSysNotification;
}

export class IconSysNotification extends SysNotification {
    public icon: string;

    constructor(
        color: string = SysNotificationColor.DEFAULT,
        title: string,
        messages: string[],
        icon: string,
    ) {
        super(IconNotificationBlockComponent, color, title, messages);
        this.icon = icon;
    }
}
