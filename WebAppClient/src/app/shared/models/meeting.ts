export type MeetingStatus = 'draft' | 'planned' | 'confirmed' | 'cancelled' | 'started' | 'ended' | 'deleted';
export type MeetingAttendanceStatus = 'absent' | 'present';

export interface Meeting {
  type: string;
  title: string;
  status: MeetingStatus; // Enum: [draft, planned, confirmed, cancelled, started, ended, deleted]
  location?: string;
  priority: number;
  plannedStartTime: string;
  realStartTime?: string;
  plannedEndTime: string;
  realEndTime?: string;
  language: string;
  deviceId: string;
  ownerUsername: string;
  attendance: MeetingAttendance[];
}

export interface MeetingAttendance {
  username: string;
  priority: number;
  arrivalTime?: string;
  status?: MeetingAttendanceStatus;
}

export interface MeetingSearchingFilter {
  hostedByMe: boolean;
  hostedByOther: boolean;
  status: MeetingStatus[];
}
