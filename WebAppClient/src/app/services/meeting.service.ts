import {Injectable} from '@angular/core';
import {Meeting, MeetingAttendance, MeetingSearchingFilter} from '../shared/models/meeting';
import {HttpClient} from '@angular/common/http';
import {AppConfig} from '../app-config';
import {Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {ListResponse} from '../utils/ListResponse';

@Injectable({
  providedIn: 'root'
})
export class MeetingService {
  constructor(private http: HttpClient) {
  }


  public createMeeting(meeting: Meeting): Observable<number> {
    return this.http.post(`${AppConfig.API_PATH}/meeting`, meeting).pipe(map((res: any) => res.id));
  }

  public getMeeting(id: string): Observable<Meeting> {
    return this.getMeetings([id])
      .pipe(
        map((res) => {
          if (res.items.length > 0) {
            return res.items[0];
          }
          throw new Error('Meeting not exist');
        })
      );
  }


  public getMeetings(ids: string[]): Observable<ListResponse<Meeting>> {
    return this.http.get<ListResponse<any>>(`${AppConfig.API_PATH}/meeting/${ids.join(';')}`)
      .pipe(map((res) => {
        res.items.map(meeting => {
          const attendanceMap = new Map<String, MeetingAttendance>();
          meeting.attendance.forEach((attendance: MeetingAttendance) => attendanceMap.set(attendance.username, attendance));
          meeting.attendance = attendanceMap;
        });
        return res as ListResponse<Meeting>;
      }));
  }


  public findMeetings(filter: MeetingSearchingFilter, resultAmount: number, resultPage: number): Observable<ListResponse<Meeting>> {
    const queryUrl = new URL(`${AppConfig.API_PATH}/meeting`);
    filter.status.forEach(includingStatus => queryUrl.searchParams.append('status', includingStatus));
    queryUrl.searchParams.append('hostedByMe', filter.hostedByMe + '');
    queryUrl.searchParams.append('hostedByOther', filter.hostedByOther + '');
    queryUrl.searchParams.append('resultPageSize', resultAmount + '');
    queryUrl.searchParams.append('resultPageNum', resultPage + '');
    return this.http.get<ListResponse<Meeting>>(queryUrl.toString());
  }
}
