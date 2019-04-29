import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, ValidationErrors, Validators} from '@angular/forms';
import {AuthService} from '../../../../services/auth.service';
import {MatDialog, MatSnackBar} from '@angular/material';
import {UserAvatarUploadDialogComponent} from '../../../../shared/components/dialogs/user-avatar-upload-dialog/user-avatar-upload-dialog.component';
import {UserService} from '../../../../services/user.service';
import {User} from '../../../../shared/models/user';

declare const gapi: any;

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.css']
})
export class UserInfoComponent implements OnInit {

  querying = false;

  public googleServiceForm = new FormGroup({});
  public userInformationForm = new FormGroup({
    username: new FormControl(this.auth.loggedInUser.username),
    displayName: new FormControl(this.auth.loggedInUser.displayName,
      [Validators.required, Validators.minLength(2), Validators.maxLength(20)]),
    email: new FormControl(this.auth.loggedInUser.email, [Validators.required, Validators.email]),
    changePassword: new FormControl(false),
    newPassword: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(60)]),
    newPasswordConfirm: new FormControl('', [
      Validators.required, Validators.minLength(8), Validators.maxLength(60),
      this.checkPasswordRepeat()
    ]),
    currentPassword: new FormControl('', [Validators.required]),
  });

  constructor(public auth: AuthService, private dialog: MatDialog, public userService: UserService,
              private snackBar: MatSnackBar) {
  }

  public randomImageParam = Math.floor(Math.random() * 100000) + 't' + new Date().getMilliseconds();

  private permissions = [
    'profile',
    'email',
  ].join(' ');

  @ViewChild('googleAuthBtn') googleAuthBtnEl: ElementRef;

  private googleOAuth2: any;


  ngOnInit() {
    gapi.load('auth2', function () {
      gapi.auth2.init();
    });
  }

  checkPasswordRepeat() {
    const _self = this;
    return (repeatPw: AbstractControl): ValidationErrors | null => {
      if (_self.userInformationForm != null && _self.userInformationForm.value.newPassword !== repeatPw.value) {
        return {passwordNotMatch: {value: repeatPw.value}};
      } else {
        return null;
      }
    };
  }

  googleLogin() {
    const googleAuth = gapi.auth2.getAuthInstance();
    googleAuth.then(() => {
      googleAuth.signIn({scope: 'profile email'}).then(googleUser => {
        console.log(googleUser.getBasicProfile());
      });
    });
  }

  editInformation() {
    const newUserInfo: User = {
      username: this.auth.loggedInUser.username,
      displayName: this.userInformationForm.value.displayName,
      email: this.userInformationForm.value.email
    } as User;

    if (this.userInformationForm.value.changePassword) {
      if (this.userInformationForm.invalid) {
        return;
      }
      newUserInfo.password = this.userInformationForm.value.newPassword;
    }

    this.querying = true;
    this.userService.editUser(newUserInfo, this.userInformationForm.value.currentPassword)
      .subscribe(() => {
        this.snackBar.open('User profile updated!', 'DISMISS', {duration: 4000});
        this.querying = false;
        this.clearPassword();
      }, () => {
        this.snackBar.open('Failed to update profile, info not valid', 'DISMISS', {duration: 4000});
        this.querying = false;
        this.clearPassword();
      });
  }

  clearPassword() {
    this.userInformationForm.patchValue({
      newPassword: '',
      newPasswordConfirm: '',
      currentPassword: ''
    });
  }

  updateImage() {
    this.randomImageParam = Math.floor(Math.random() * 100000) + 't' + new Date().getMilliseconds();
  }

  uploadAvatar() {
    const dialogRef = this.dialog.open(UserAvatarUploadDialogComponent);
    dialogRef.afterClosed().subscribe(() => {
      this.updateImage();
    });
  }

}
