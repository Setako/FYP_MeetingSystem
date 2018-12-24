import {Injectable} from '@angular/core';
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {MatSnackBar} from '@angular/material';
import {concat, iif, Observable, of, throwError} from 'rxjs';
import {AuthService} from './auth.service';
import {concatMap, delay, flatMap, map, retryWhen, take, tap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class HttpCommonErrorHandlerService implements HttpInterceptor {

  constructor(private snackBar: MatSnackBar, private auth: AuthService) {

  }

  public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return new Observable((observer) => {
      next.handle(req).pipe(retryWhen((err) => {

        return err.pipe(
          concatMap((pipeErr, times) => {
            return iif(
              () => times >= 3,
              throwError(pipeErr),
              of(pipeErr).pipe(tap(() => {
                this.snackBar.open('Connection Error occurred, retrying', null, {
                  duration: 3000
                });
              }), delay(3000))
            );
          })
        );
      })).subscribe(
        res => {
          observer.next(res);
        },
        err => {
          if (err instanceof HttpErrorResponse) {
            switch (err.status) {
              case 0:
              case 503:
                this.snackBar.open('Connection Error occurred', null, {
                  duration: 10000
                });
                observer.complete();
                break;
              case 401:
                if (this.auth.isLoggedIn) {
                  this.auth.logout();
                  observer.complete();
                  break;
                } else {
                  observer.error(err);
                  break;
                }
              default:
                observer.error(err);
                break;
            }
          }
        }
      );
    });

  }
}
