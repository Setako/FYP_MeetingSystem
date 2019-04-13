import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {AppConfig} from '../app-config';
import {ListResponse} from '../utils/list-response';
import {map} from 'rxjs/operators';
import {AuthService} from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserIntegrationService {

  constructor(private http: HttpClient, private authService: AuthService) {

  }

  public getPossibleCalendars(): Observable<GoogleCalendar[]> {
    return this.http.get<ListResponse<GoogleCalendar>>(`${AppConfig.API_PATH}/google/calendar`).pipe(map(res => res.items));
  }

  public getFaceImages(): Observable<FaceImage[]> {
    return this.http.get<ListResponse<FaceImage>>(`${AppConfig.API_PATH}/user/${this.authService.loggedInUser.username}/faces`)
      .pipe(map(res => res.items));
  }

  public deleteFaceImages(imageIds: string[]): Observable<any> {
    return this.http.delete(`${AppConfig.API_PATH}/user/${this.authService.loggedInUser.username}/faces/${imageIds.join(';')}`);
  }

  upload(file: File): Observable<any> {
    console.log('ok3');
    const formData = new FormData();
    formData.append('faces', file);
    return this.http.post(`${AppConfig.API_PATH}/user/${this.authService.loggedInUser.username}/faces`, formData);
  }
}
