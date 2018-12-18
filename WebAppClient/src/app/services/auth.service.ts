import {Injectable} from '@angular/core';
import {EMPTY, Observable} from 'rxjs';
import {User} from '../shared/models/user';
import {HttpClient} from '@angular/common/http';
import {AppConfig} from '../app-config';
import {mergeMap, tap} from 'rxjs/operators';
import {Router} from '@angular/router';
import {ListResponse} from '../utils/ListResponse';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _loggedInUser: User;

  // private _token: string;

  constructor(private http: HttpClient, private router: Router) {
  }


  get loggedInUser(): User {
    return this._loggedInUser;
  }

  get token(): string {
    return this._token;
  }

  private set _token(token: string) {
    if (token == null) {
      localStorage.removeItem('token');
    } else {
      localStorage.setItem('token', token);
    }
  }

  private get _token(): string {
    return localStorage.getItem('token');
  }

  get tokenObject(): any {
    return JSON.parse(atob(this._token.split('.')[1]));
  }

  get isLoggedIn(): boolean {
    return this.token != null && new Date(this.tokenObject.exp * 1000) > new Date();
  }

  public updateUserInfo() {
    if (!this.isLoggedIn) {
      return EMPTY;
    } else {
      const username = this.tokenObject.username;
      return this.http.get<ListResponse<User>>(`${AppConfig.API_PATH}/user/${username}`)
        .pipe(tap((res) => {
          this._loggedInUser = res.items[0];
        }));
    }
  }

  public login(username: string, password: string): Observable<any> {
    return this.http.post(`${AppConfig.API_PATH}/auth/login`, {
      username: username,
      password: password
    }).pipe(tap((res: any) => this._token = res.token.replace('Bearer ', '')));
  }

  public logout() {
    this._token = null;
    this.router.navigate(['/login']);
  }

  public register(user: User): Observable<Object> {
    return this.http.post(`${AppConfig.API_PATH}/auth/register`, user)
      .pipe(mergeMap(() => this.login(user.username, user.password)));
  }
}
