import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {ListResponse} from '../utils/list-response';
import {FriendRequest, User} from '../shared/models/user';
import {HttpClient} from '@angular/common/http';
import {AppConfig} from '../app-config';

@Injectable({
  providedIn: 'root'
})
export class FriendService {

  constructor(public http: HttpClient) {
  }

  public getReceivedRequests(): Observable<ListResponse<FriendRequest>> {
    return this.http.get<ListResponse<FriendRequest>>(`${AppConfig.API_PATH}/friend/request/received`);
  }

  public sendRequest(username: string): Observable<any> {
    return this.http.post(`${AppConfig.API_PATH}/friend/request/${username}`, {});
  }
}
