import {Component, OnInit} from '@angular/core';
import {Observable, timer} from 'rxjs';
import {concatMap, mergeMap, tap} from 'rxjs/operators';
import {NotificationService} from '../../../services/notification.service';
import {UserNotification} from '../../models/userNotification';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  public notifications: UserNotification[] = [];

  constructor(private notificationService: NotificationService) {
  }

  ngOnInit() {
    timer(0, 10000)
      .pipe(mergeMap((_) => this.notificationService.getNotifications()))
      .subscribe((res) => this.notifications = res);
  }

}
