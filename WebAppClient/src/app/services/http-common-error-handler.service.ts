import {Injectable} from '@angular/core';
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {MatSnackBar} from '@angular/material';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HttpCommonErrorHandlerService implements HttpInterceptor {

  constructor(private snackBar: MatSnackBar) {

  }

  public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return new Observable((observer) => {
      console.log(req)
      next.handle(req).subscribe(
        res => {
          observer.next(res);
        },
        err => {
          if (err instanceof HttpErrorResponse) {
            switch (err.status) {
              case 0:
                this.snackBar.open('Connection Error occurred', null, {
                  duration: 5000
                });
                observer.complete();
                break;
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
