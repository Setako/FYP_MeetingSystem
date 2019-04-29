import {Component, OnInit} from '@angular/core';
import {UserIntegrationService} from '../../../../services/user-integration.service';
import {defer, from, Observable, of} from 'rxjs';
import {flatMap, tap} from 'rxjs/operators';
import {ConfirmationDialogComponent} from '../../../../shared/components/dialogs/confirmation-dialog/confirmation-dialog.component';
import {MatDialog, MatSnackBar} from '@angular/material';

@Component({
  selector: 'app-face-recognition-setting',
  templateUrl: './face-recognition-setting.component.html',
  styleUrls: ['./face-recognition-setting.component.css']
})
export class FaceRecognitionSettingComponent implements OnInit {

  constructor(private integrationService: UserIntegrationService, private dialog: MatDialog, private snackBar: MatSnackBar) {
  }

  public uploadedFaceImages: FaceImage[];
  public querying = false;
  public queryingAction = '';
  public uploading = 0;

  colorMap = {
    'invalid': '#ff545b',
    'trained': '#00f378',
    'waiting': '#ffd700'
  };

  ngOnInit() {
    this.update().subscribe();
  }

  update(): Observable<any> {
    return defer(() => {
      this.querying = true;
      this.queryingAction = 'Updating Images';
      return of(0);
    }).pipe(
      flatMap(() => this.integrationService.getFaceImages()),
      tap(images => {
          this.uploadedFaceImages = images;
          this.querying = false;
        }, () => {
          this.querying = false;
        }
      )
    );
  }

  delete(imageId) {

    this.dialog.open(ConfirmationDialogComponent, {
      data: {title: 'Confirmation', content: `Delete image?`}
    }).afterClosed().subscribe(res => {
      if (res) {
        this.querying = true;
        this.queryingAction = 'Deleting Images';
        this.integrationService.deleteFaceImages([imageId]).pipe(
          tap(() => {
              this.querying = false;
            }, () => {
              this.querying = false;
            }
          ),
          flatMap(() => this.update())
        ).subscribe();
      }
    });
  }

  deleteAll() {
    this.dialog.open(ConfirmationDialogComponent, {
      data: {title: 'Confirmation', content: `Delete all image?`}
    }).afterClosed().subscribe(res => {
      if (res) {
        this.querying = true;
        this.queryingAction = 'Deleting Images';
        this.integrationService.deleteFaceImages(this.uploadedFaceImages.map(image => image.id)).pipe(
          tap(() => {
              this.querying = false;
            }, () => {
              this.querying = false;
            }
          ),
          flatMap(() => this.update())
        ).subscribe();
      }
    });
  }


  selectImage(event: Event) {
    const formData = new FormData();
    const fileReader = new FileReader();
    fileReader.readAsDataURL((event.target as any).files[0]);
    fileReader.onload = (e: any) => {

      const fileList = ((event.target as any).files as FileList);

      if (fileList.length <= 10) {
        const files = [];
        for (let i = 0; i < fileList.length; i++) {
          files.push(fileList.item(i));
        }
        this.querying = true;
        this.uploading = fileList.length;
        this.queryingAction = `Uploading ${this.uploading} images...`;
        from(files).pipe(
          flatMap(file => this.uploadImage(file))
        ).subscribe(() => {
          this.uploading--;
          this.queryingAction = `Uploading ${this.uploading} images...`;
          if (this.uploading === 0) {
            this.querying = false;
            this.update().subscribe();
          }
        }, (err) => {
          this.uploading--;
          this.queryingAction = `Uploading ${this.uploading} images...`;
          if (this.uploading === 0) {
            this.querying = false;
            this.update().subscribe();
          }
        });
      } else {
        this.snackBar.open('The maximum of upload file amount in once time is 10.', 'DISMISS', {duration: 4000});
      }
    };
  }

  uploadImage(file: File) {
    return this.integrationService.upload(file);

  }
}
