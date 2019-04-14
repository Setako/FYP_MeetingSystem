import {ChangeDetectorRef, Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef, MatSnackBar} from '@angular/material';
import {GoogleOauthService} from '../../../../services/google/google-oauth.service';
import {from, Observable} from 'rxjs';
import {flatMap} from 'rxjs/operators';

declare var gapi: any;

@Component({
  selector: 'app-shared-files-dialog',
  templateUrl: './shared-files-dialog.component.html',
  styleUrls: ['./shared-files-dialog.component.css']
})
export class SharedFilesDialogComponent implements OnInit {
  public sharedFileIds: string[] = [];
  public sharedFiles: { resId: string, name: string }[] = [];
  public querying = true;

  constructor(public dialogRef: MatDialogRef<SharedFilesDialogComponent>,
              @Inject(MAT_DIALOG_DATA) data,
              private googleOauthService: GoogleOauthService, private cdr: ChangeDetectorRef, private snackBar: MatSnackBar) {
    this.sharedFileIds = data.sharedFileIds;
  }

  ngOnInit() {
    const self = this;
    this.googleOauthService.gapiInit().subscribe(() => {
    }, err => {
    }, () => {
      self.googleOauthService.doRequest<any>(
        (token) => {
          return from(self.sharedFileIds)
            .pipe(
              flatMap(id => self.getFileById(id)),
            );
        }
      ).subscribe(
        res => {
          self.sharedFiles.push({
            resId: res.id,
            name: res.title
          });
          self.cdr.detectChanges();
          self.querying = false;
        }, err => {
          this.snackBar.open('You are not connected to google yet', 'DISMISS', {duration: 4000});
          self.querying = false;
          this.dialogRef.close();
        }
      );
    });
  }

  openSharedFiles(resId: string) {
    window.open(`https://drive.google.com/open?id=${resId}`, '_blank');
    console.log(resId);
  }


  public getFileById(id: string): Observable<any> {
    return Observable.create((observer) => {
      gapi.client.drive.files.get({'fileId': id}).execute(resp => {
        observer.next(resp);
        observer.complete();
      });
    });
  }

}
