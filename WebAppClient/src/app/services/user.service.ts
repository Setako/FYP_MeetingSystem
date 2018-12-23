import {Injectable} from '@angular/core';
import {User} from '../shared/models/user';
import {AppConfig} from '../app-config';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor() {
  }

  public getUserAvatarPath(user: User) {
    return `${AppConfig.API_PATH}/user/${user.username}/avatar`;
  }
}
