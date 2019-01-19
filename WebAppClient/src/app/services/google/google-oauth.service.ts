import {Injectable} from '@angular/core';
import {AuthService} from '../auth.service';
import {interval, observable, Observable, of, race, throwError} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {AppConfig} from '../../app-config';
import {catchError, delay, filter, map, mergeMap, retry, retryWhen, scan, take, tap} from 'rxjs/operators';
import {MatSnackBar} from '@angular/material';
import {Router} from '@angular/router';
import {PlatformLocation} from '@angular/common';
import {GoogleAccessToken} from '../../shared/models/google-oauth';
import {google, oauth2_v2} from 'googleapis';
import {auth} from 'google-auth-library';
import Oauth2 = oauth2_v2.Oauth2;

declare global {
  interface Window {
    cc: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class GoogleOauthService {

  private authSuccessCb: () => any;
  private _googleAccessToken: GoogleAccessToken;

  constructor(private authService: AuthService, private http: HttpClient, private snackBar: MatSnackBar,
              private router: Router, private platformLocation: PlatformLocation) {
    window.cc = window.cc || {};
    window.cc.googleAuthCb = this.googleAuthCb.bind(this);
  }

  public googleAuthCb() {
    if (this.authSuccessCb != null) {
      this.authSuccessCb();
    }
  }

  public connectGoogle(): Observable<any> {
    const authWindow = window.open('', 'Google Oauth');
    if (!authWindow.opener) {
      authWindow.opener = this;
    }
    authWindow.focus();
    return this.http
      .get<any>(`${AppConfig.API_PATH}/google/auth/url?successRedirect=${this.platformLocation.pathname}/assets/authSuccess.html`)
      .pipe(
        map(res => res.url),
        mergeMap(url => this.showGoogleOauth(authWindow, url)),
      );
  }

  private showGoogleOauth(authWindow: Window, url): Observable<string> {
    console.log(url);
    authWindow.location.href = url;
    return race(
      interval(250).pipe(
        filter(() => authWindow.closed),
        take(1),
        map((_) => {
          throw new Error('Auth window closed');
        })
      ),
      Observable.create((observer) => {
        this.authSuccessCb = () => {
          observer.next();
          observer.complete();
        };
      }).pipe(
        mergeMap(() => this.getUserGoogleAccessToken())
      )
    );
  }

  private getUserGoogleAccessToken(): Observable<GoogleAccessToken> {
    return this.http.get<any>(`${AppConfig.API_PATH}/google/auth/access-token`)
      .pipe(
        map(res => ({token: res.token} as GoogleAccessToken)),
        tap(token => this._googleAccessToken = token)
      );
  }

  get accessToken(): Observable<GoogleAccessToken> {
    if (this._googleAccessToken == null) {
      return this.getUserGoogleAccessToken();
    } else {
      return of(this._googleAccessToken);
    }
  }


  public doRequest<T>(func: (client: any) => Observable<T>): Observable<T> {
    const client = new google.auth.OAuth2();
    return this.accessToken
      .pipe(
        tap((token: GoogleAccessToken) => client.setCredentials({access_token: token.token})),
        mergeMap((_) => func(client)),
        retryWhen((err$) => {
          return err$.pipe(
            scan((count, err) => {
              const isCredentailWrong = true;
              if (isCredentailWrong && count <= 2) {
                this._googleAccessToken = null;
                return count++;
              } else {
                throw err;
              }
            }, 0)
          );
        })
      );
  }
}

