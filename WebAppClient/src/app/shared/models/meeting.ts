import {User} from './user';

export type MeetingStatus = 'draft' | 'planned' | 'confirmed' | 'cancelled' | 'started' | 'ended' | 'deleted';
export type MeetingAttendanceStatus = 'absent' | 'present' | 'exit';

export interface Meeting {
  id: string;
  type: string;
  title: string;
  status: MeetingStatus; // Enum: [draft, planned, confirmed, cancelled, started, ended, deleted]
  location?: string;
  length: number;
  description: string;
  priority: number;
  plannedStartTime: string;
  realStartTime?: string;
  plannedEndTime: string;
  realEndTime?: string;
  language: string;
  deviceId: string;
  ownerUsername: string;
  attendance: Map<String, MeetingAttendance>;
  // optional: ownername
  owner?: User;
}

export interface MeetingAttendance {
  username: string;
  proiority: number;
  arrivalTime?: Date;
  status?: MeetingAttendanceStatus;
  permission: AccessPostMeetingPermission;
  googleCalendarEventId?: string;
}

export class AccessPostMeetingPermission {
  public accessShareResources: boolean;
  public accessRecordedVoice: boolean;
  public accessTextRecordOfSpeech: boolean;
  public accessAttendanceRecord: boolean;
  public makeMeetingMinute: boolean;
  public reviewMeetingMinute: boolean;
}

export interface MeetingSearchingFilter {
  hostedByMe: boolean;
  hostedByOther: boolean;
  status: MeetingStatus[];
}
