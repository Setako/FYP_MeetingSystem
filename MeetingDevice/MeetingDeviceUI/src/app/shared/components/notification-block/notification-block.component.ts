import {Type} from '@angular/core';

export abstract class NotificationBlockComponent {
    notification: SysNotification;
}

export enum SysNotificationColor {
    DANGER = '#FF0000',
    WARNING = '#FFFF00',
    SUCCESS = '#00FF00',
    DEFAULT = '#FFF',
}

export abstract class SysNotification {
    private _componentType: Type<NotificationBlockComponent>;
    public color: string = SysNotificationColor.DEFAULT;
    public title: string;
    public messages: string[];

    get componentType(): Type<NotificationBlockComponent> {
        return this._componentType;
    }

    constructor(
        componentType: Type<NotificationBlockComponent>,
        color: string,
        title: string,
        messages: string[],
    ) {
        this._componentType = componentType;
        this.color = color;
        this.title = title;
        this.messages = messages;
    }
}
