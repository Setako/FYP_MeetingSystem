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
  notification?: {
    friendRequest: {
      email: boolean,
      notification: boolean
    },
    meetingInfoUpdate: {
      email: boolean,
      notification: boolean
    },
    meetingInvitation: {
      email: boolean,
      notification: boolean
    },
    meetingCancelled: {
      email: boolean,
      notification: boolean
    },
    meetingReminder: {
      email: boolean,
      notification: boolean
    }
  };
}
