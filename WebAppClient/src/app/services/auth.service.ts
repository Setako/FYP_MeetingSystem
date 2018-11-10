import {Injectable} from '@angular/core';
import {concat, Observable} from 'rxjs';
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

  public register(username: string, email: string, password: string): Observable<Object> {
    return concat(this.http.post(`${AppConfig.API_PATH}/auth/register`, {
      username: username,
      password: password,
      email: email
    }), this.login(username, password));
  }

  public isLoggedIn(): boolean {
    return this.loggedInUser != null;
  }
}
