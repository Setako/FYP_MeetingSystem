import {Component, OnInit} from '@angular/core';
import {NotificationService} from '../../../services/notification.service';
import {UserNotification} from '../../models/userNotification';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {

  constructor(public notificationService: NotificationService) {
  }

  ngOnInit() {
  }

  dismiss(notification: UserNotification) {
    this.notificationService.dismissNotification(notification).subscribe();
  }

  dismissAll() {
    this.notificationService.dismissNotifications().subscribe();
  }
}
