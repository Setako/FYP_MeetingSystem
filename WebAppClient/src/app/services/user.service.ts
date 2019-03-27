import {Injectable} from '@angular/core';
import {User} from '../shared/models/user';
import {AppConfig} from '../app-config';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {AuthService} from './auth.service';
import {mergeMap, tap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient, private auth: AuthService) {
  }

  public getUserAvatarPath(user: User) {
    return `${AppConfig.API_PATH}/user/${user.username}/avatar`;
  }

  public updateUserAvatar(user: User, imageDataUrl: string): Observable<any> {
    return this.http.post(`${AppConfig.API_PATH}/user/${user.username}/avatar`, {dataUrl: imageDataUrl})
      .pipe(tap((_) => {
        if (user.username === this.auth.loggedInUser.username) {
          this.auth.updateUserAvatar();
        }
      }));
  }

  public editUser(user: User | any, currentPassword?: string): Observable<any> {
    user.currentPassword = currentPassword;
    return this.http.put(`${AppConfig.API_PATH}/user/${user.username}`, user)
      .pipe(mergeMap(() => this.auth.updateUserInfo()));
  }
}
