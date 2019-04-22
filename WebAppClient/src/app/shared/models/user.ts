export type FriendRequestStatus = 'accept' | 'deny' | 'requested';

export interface User {
  username?: string;
  password?: string;
  displayName?: string;
  email?: string;
  userMeetingRelation?: string[];
  setting?: UserSettings;
}


export interface FriendRequest {
  user: User;
  targetUser: User;
  requestTime: string;
  status: FriendRequestStatus;
}

export interface Friend {
  user: User;
  addDate: Date;
  stared: boolean;
}

export interface UserSettings {
  markEventOnCalendarId?: string;
  calendarImportance?: {
    carlendarId: string,
    importance: number
  }[];
  notification?: { [id: string]: { email: boolean, notification: boolean } };
  privacy?: {
    allowOtherToSendFirendRequest?: boolean
  };
}
