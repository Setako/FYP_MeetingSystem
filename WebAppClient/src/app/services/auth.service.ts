import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {User} from '../shared/models/user';
import {HttpClient} from '@angular/common/http';
import {AppConfig} from '../app-config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loggedInUser: User;

  constructor(private http: HttpClient) {
  }

  public login(username: string, password: string): Observable<Object> {
    return this.http.post(`${AppConfig.API_PATH}/auth/login`, {
      username: username,
      password: password
    });
  }

  public isLoggedIn(): boolean {
    return this.loggedInUser != null;
  }
}
