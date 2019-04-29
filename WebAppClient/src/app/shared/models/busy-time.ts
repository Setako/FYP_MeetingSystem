import {User} from './user';

export interface BusyTime {
  busyLevel: number;
  fromDate: string;
  toDate: string;
  users: User[];
}
