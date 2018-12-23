export type FriendRequestStatus = 'accept' | 'deny' | 'requested';

export interface User {
  username: string;
  password?: string;
  displayName: string;
  email: string;
  userMeetingRelation: string[];
  friends: User[];
}


export interface FriendRequest {
  user: User;
  targetUser: User;
  requestTime: string;
  status: FriendRequestStatus;
}
