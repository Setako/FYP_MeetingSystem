import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
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
  public googleServiceForm = new FormGroup({});

  public userInformationForm = new FormGroup({
    username: new FormControl(this.auth.loggedInUser.username),
    displayName: new FormControl(this.auth.loggedInUser.displayName,
      [Validators.required, Validators.minLength(2), Validators.maxLength(20)]),
    email: new FormControl(this.auth.loggedInUser.email, [Validators.required, Validators.email]),
    changePassword: new FormControl(false),
    newPassword: new FormControl('', [Validators.minLength(8), Validators.maxLength(60)]),
    newPasswordConfirm: new FormControl('', [Validators.minLength(8), Validators.maxLength(60)]),
    currentPassword: new FormControl('', [Validators.required]),
  }, {validators: [this.checkPasswordRepeat]});

  private permissions = [
    'profile',
    'email',
  ].join(' ');

  @ViewChild('googleAuthBtn') googleAuthBtnEl: ElementRef;

  private googleOAuth2: any;

  constructor(public auth: AuthService, private dialog: MatDialog, public userService: UserService,
              private snackBar: MatSnackBar) {
  }

  ngOnInit() {
    gapi.load('auth2', function () {
      gapi.auth2.init();
    });
  }


  checkPasswordRepeat(form: FormGroup) {
    if (form.value.password !== form.value.passwordConfirm) {
      const error = {passwordNotMatch: true};
      form.controls.passwordConfirm.setErrors(error);
      return error;
    } else {
      return null;
    }
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
      newUserInfo.password = this.userInformationForm.value.newPassword;
    }
    this.userService.editUserProfile(newUserInfo, this.userInformationForm.value.currentPassword)
      .subscribe(() => this.snackBar.open('User profile updated!', 'Dismiss', {duration: 4000}));
  }

  editGoogleServiceSettings() {

  }


  authGoogle() {

  }

  uploadAvatar() {
    this.dialog.open(UserAvatarUploadDialogComponent);
  }
}
