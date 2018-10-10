import {Injectable} from '@angular/core';
import {SysNotification} from '../../shared/components/notification-block/notification-block.component';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor() {
  }

  private _notifications: SysNotification[] = [];

  public addNotification(notification: SysNotification) {
    this.removeNotification(notification);
    this._notifications.push(notification);
  }

  public removeNotification(notification: SysNotification) {
    const index = this._notifications.indexOf(notification);
    if (index > -1) {
      this._notifications.splice(index, 1);
    }
  }

  get notifications(): SysNotification[] {
    return this._notifications;
  }
}
