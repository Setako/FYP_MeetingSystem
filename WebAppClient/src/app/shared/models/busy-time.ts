import {User} from './user';

export interface BusyTime {
  fromDate: string;
  toDate: string;
  users: User[];
}
