import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {AppConfig} from '../app-config';
import {ListResponse} from '../utils/list-response';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserIntegrationService {

  constructor(private http: HttpClient) {

  }

  public getPossibleCalendars(): Observable<GoogleCalendar[]> {
    return this.http.get<ListResponse<GoogleCalendar>>(`${AppConfig.API_PATH}/google/calendar`).pipe(map(res => res.items));
  }
}
