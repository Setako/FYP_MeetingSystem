import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {ListResponse} from '../utils/list-response';
import {Friend, FriendRequest} from '../shared/models/user';
import {HttpClient} from '@angular/common/http';
import {AppConfig} from '../app-config';

@Injectable({
  providedIn: 'root'
})
export class FriendService {

  constructor(public http: HttpClient) {
  }

  public getReceivedRequests(): Observable<ListResponse<FriendRequest>> {
    return this.http.get<ListResponse<FriendRequest>>(`${AppConfig.API_PATH}/friend-request/received`);
  }

  public getSentRequests(): Observable<ListResponse<FriendRequest>> {
    return this.http.get<ListResponse<FriendRequest>>(`${AppConfig.API_PATH}/friend-request?status=requested`);
  }

  public responseRequest(username: string, accept: boolean): Observable<any> {
    return this.http.put(`${AppConfig.API_PATH}/friend-request/received/${username}`,
      {accept: accept});
  }

  public sendRequest(username: string): Observable<any> {
    return this.http.post(`${AppConfig.API_PATH}/friend-request/${username}`, {});
  }

  public deleteFriend(username: string): Observable<any> {
    return this.http.delete(`${AppConfig.API_PATH}/friend/${username}`);
  }

  public deleteSentRequest(username: string): Observable<any> {
    return this.http.delete(`${AppConfig.API_PATH}/friend-request/${username}`);
  }

  public getFriends(): Observable<ListResponse<Friend>> {
    return this.http.get<ListResponse<Friend>>(`${AppConfig.API_PATH}/friend`);
  }
}
