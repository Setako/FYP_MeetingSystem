import {Component, OnInit} from '@angular/core';
import {AddFriendDialogComponent} from '../add-friend-dialog/add-friend-dialog.component';
import {MatDialogRef, MatSnackBar} from '@angular/material';
import {UserService} from '../../../../services/user.service';
import {AuthService} from '../../../../services/auth.service';

@Component({
  selector: 'app-user-avatar-upload-dialog',
  templateUrl: './user-avatar-upload-dialog.component.html',
  styleUrls: ['./user-avatar-upload-dialog.component.css']
})
export class UserAvatarUploadDialogComponent implements OnInit {
  public imageDataUrl: string = null;
  public querying = false;

  constructor(public dialogRef: MatDialogRef<AddFriendDialogComponent>, public userService: UserService,
              public authService: AuthService, public snackBar: MatSnackBar) {
  }

  ngOnInit() {

  }

  selectImage(event: Event) {
    const fileReader = new FileReader();
    fileReader.readAsDataURL((event.target as any).files[0]);
    fileReader.onload = (e: any) => this.imageDataUrl = e.target.result;
  }

  uploadImage(event: Event) {
    this.querying = true;
    this.userService.updateUserAvatar(this.authService.loggedInUser, this.imageDataUrl).subscribe(() => {
      this.querying = false;
      this.snackBar.open('Avatar uploaded!', 'Dismiss', {duration: 4000});
      this.dialogRef.close();
    });
  }
}
