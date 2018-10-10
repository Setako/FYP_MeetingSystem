import {Component, OnInit} from '@angular/core';
import {NotificationService} from '../../services/notification/notification.service';
import {IconSysNotification} from '../../shared/components/notification-block/icon-notification-block.component';

@Component({
  selector: 'app-notifications-container',
  templateUrl: './notifications-container.component.html'
})
export class NotificationsContainerComponent implements OnInit {

  constructor(public notificationService: NotificationService) {
  }

  ngOnInit() {
    this.notificationService.addNotification(
      new IconSysNotification(null, 'Testing', ['Testing message'], 'favorite')
    );
    this.notificationService.addNotification(
      new IconSysNotification(undefined, 'Testing3', ['Testing message'], 'favorite')
    );
    this.notificationService.addNotification(
      new IconSysNotification(undefined, 'Testing4', ['Testing message'], 'favorite')
    );
  }

}
