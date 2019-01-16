import {FriendRequest} from './user';
import {Meeting} from './meeting';

export type UserNotificationType
  = 'friendRequestReceived'
  | 'friendRequestAccepted'
  | 'friendRequestRejected'
  | 'meetingInviteReceived'
  | 'meetingUpdated'
  | 'meetingCancelled'
  | 'meetingReminder';

export class UserNotification {
  id: string;
  title: string;
  content: string;
  clickAction: () => any;
  time: Date;

  constructor(id: string, title: string, content: string, clickAction: () => any, time: Date) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.clickAction = clickAction;
    this.time = time;
  }
}

