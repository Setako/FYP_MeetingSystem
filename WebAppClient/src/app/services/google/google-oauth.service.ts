import {Injectable} from '@angular/core';
import {AuthService} from '../auth.service';
import {interval, Observable, of, race} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {AppConfig} from '../../app-config';
import {concatAll, delay, filter, flatMap, map, mergeMap, retryWhen, scan, take, tap} from 'rxjs/operators';
import {MatSnackBar} from '@angular/material';
import {Router} from '@angular/router';
import {PlatformLocation} from '@angular/common';
import {GoogleAccessToken} from '../../shared/models/google-oauth';

declare global {
  interface Window {
    cc: any;
  }
}
declare var gapi: any;
declare var google: any;

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

  get accessToken(): Observable<GoogleAccessToken> {
    if (this._googleAccessToken == null) {
      console.log('s1');
      return this.getUserGoogleAccessToken();
    } else {
      console.log('s2');
      return of(this._googleAccessToken);
    }
  }

  public connectGoogle(): Observable<any> {
    const authWindow = window.open('', 'Google Oauth',
      'menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes');
    if (!authWindow.opener) {
      authWindow.opener = this;
    }
    authWindow.focus();
    return this.http
      .get<any>(`${AppConfig.API_PATH}/google/auth/url?successRedirect=${
        encodeURIComponent(window.location.origin + '/assets/auth-success.html')}`)
      .pipe(
        map(res => res.url),
        mergeMap(url => this.showGoogleOauth(authWindow, url)),
      );
  }

  public disconnectGoogle(): Observable<any> {
    this._googleAccessToken = null;
    return this.http.delete(`${AppConfig.API_PATH}/google/auth/refresh-token`);
  }

  public gapiInit(): Observable<any> {
    const funcs: (() => Observable<any>)[] = [
      () => this.gapiLoad('client'),
      () => this.gapiLoad('picker'),
      () => this.gapiClientLoad('drive', 'v2')
    ];
    return of(funcs)
      .pipe(
        flatMap(x => x),
        map(f => f()),
        concatAll(),
      );
  }

  test(token: GoogleAccessToken) {
    return Observable.create(
      (observer) => {
        console.log('created');
        // gapi.client.drive.files.list({
        //   'pageSize': 10,
        //   'fields': 'nextPageToken, files(id, name)'
        // }).then(function (response) {
        //   console.log('Files:');
        //   const files = response.result.files;
        //   if (files && files.length > 0) {
        //     for (let i = 0; i < files.length; i++) {
        //       const file = files[i];
        //       console.log(file.name + ' (' + file.id + ')');
        //     }
        //   } else {
        //     console.log('No files found.');
        //   }
        //   observer.next(response);
        //   observer.complete();
        // });
        const folderView = new google.picker.​DocsView(google.picker.ViewId.FOLDERS);
        folderView.setParent('root');
        folderView.setSelectFolderEnabled(true);
        const picker = new google.picker.PickerBuilder()
          .addView(folderView)
          .setOAuthToken(token.token)

          .setDeveloperKey('AIzaSyDTfef8MKO3gUXKvbCJsiArpUNtmdajYCY')
          .setCallback((cb) => {
            console.log(cb);
            if (cb.action === 'cancel') {
              observer.complete();
            } else if (cb.action === 'picked') {
              observer.next(cb);
              observer.complete();
            }
          })
          .build();
        picker.setVisible(true);
      }
    );

  }

  public doRequest<T>(func: (token: GoogleAccessToken) => Observable<T>): Observable<T> {

    const client = gapi.client;
    return this.accessToken
      .pipe(
        tap((token: GoogleAccessToken) => client.setToken({access_token: token.token})),
        mergeMap((token => func(token))),
        retryWhen((err$) => {
          return err$.pipe(
            scan((count, err) => {
              const isCredentailWrong = true;
              if (!isCredentailWrong || count > 2) {
                throw err;
              }
              this._googleAccessToken = null;
              return count + 1;
            }, 1),
            delay(100)
          );
        })
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
          throw new Error('Auth window closed by user');
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

  private gapiLoad(m: string): Observable<any> {
    return Observable.create((observer) => {
      gapi.load(m, {
        callback: () => {
          observer.complete();
        },
        onerror: observer.error,
        timeout: 1000, // 5 seconds.
        ontimeout: observer.error
      });
    });
  }

  private gapiClientLoad(m: string, v: string): Observable<any> {
    return Observable.create((observer) => {
      console.log('l ' + m);
      gapi.client.load(m, v, function () {
        console.log('s ' + m);
        observer.complete();
      });
    });
  }
}

