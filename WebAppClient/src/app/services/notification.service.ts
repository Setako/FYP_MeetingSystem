import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {AuthService} from './auth.service';
import {Observable, timer} from 'rxjs';
import {ListResponse} from '../utils/list-response';
import {UserNotification, UserNotificationType} from '../shared/models/userNotification';
import {FriendRequest} from '../shared/models/user';
import {Meeting} from '../shared/models/meeting';
import {Router} from '@angular/router';
import {filter, map, mergeMap, retry, tap} from 'rxjs/operators';
import {AppConfig} from '../app-config';
import {DatePipe} from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  public notifications: UserNotification[] = [];
  private notificationDTOEntityMapper
    : { [type in UserNotificationType]: (dto: UserNotificationDTO) => UserNotification } = {
    friendRequestAccepted: (dto) => {
      const friendRequest = dto.object as FriendRequest;

      return new UserNotification(
        dto.id, 'Friend Request Accepted',
        `${friendRequest.targetUser.displayName} was accepted your friend request!`,
        () => this.router.navigate(['/member/user/friends']), dto.time);
    },
    friendRequestReceived: (dto) => {
      const friendRequest = dto.object as FriendRequest;

      return new UserNotification(
        dto.id, 'Friend Request',
        `${friendRequest.user.displayName} has sent a friend request to you`,
        () => this.router.navigate(['/member/user/friends']), dto.time);
    },
    friendRequestRejected: (dto) => {
      const friendRequest = dto.object as FriendRequest;

      return new UserNotification(
        dto.id, 'Friend Request Rejected',
        `${friendRequest.targetUser.displayName} was rejected your friend request`,
        () => this.router.navigate(['/member/user/friends']), dto.time);
    },
    meetingInviteReceived: (dto) => {
      const meeting = dto.object as Meeting;

      return new UserNotification(
        dto.id, 'Meeting Invite',
        `${meeting.owner.displayName} is inviting you to join the meeting: ${meeting.title}`,
        () => this.router.navigate(['/member/user/friends']), dto.time);
    },
    meetingUpdated: (dto) => {
      const meeting = dto.object as Meeting;

      return new UserNotification(
        dto.id, 'Meeting Info Updated',
        `${meeting.owner.displayName} is inviting you to join the meeting: ${meeting.title}`,
        () => this.router.navigate([`/member/meeting/${meeting.id}`]), dto.time);
    },
    meetingReminder: (dto) => {
      const meeting = dto.object as Meeting;

      return new UserNotification(
        dto.id, 'Meeting Reminder',
        `${meeting.title} Will start at ${this.datePipe.transform(new Date(meeting.plannedStartTime), 'short')}`,
        () => this.router.navigate([`/member/meeting/${meeting.id}`]), dto.time);
    },
    meetingCancelled: (dto) => {
      const meeting = dto.object as Meeting;

      return new UserNotification(
        dto.id, 'Meeting Cancelled',
        `${meeting.title} was cancelled`,
        () => this.router.navigate([`/member/meeting/${meeting.id}`]), dto.time);
    }
  };

  constructor(private http: HttpClient, private auth: AuthService, private router: Router, private datePipe: DatePipe) {
    timer(0, 10000)
      .pipe(
        filter((_) => this.auth.isLoggedIn),
        mergeMap((_) => this.getNotifications()),
        retry()
      )
      .subscribe((res) => this.notifications = res);
  }

  public getNotifications(): Observable<UserNotification[]> {
    return this.http.get<ListResponse<UserNotificationDTO>>(`${AppConfig.API_PATH}/notification`)
      .pipe(
        map(res => res.items.map((dto) => this.notificationDTOEntityMapper[dto.type](dto))
        )
      );
  }
}

class UserNotificationDTO {
  id: string;
  type: UserNotificationType;
  time: Date;
  object: FriendRequest | Meeting;
}
