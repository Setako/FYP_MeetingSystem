import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AuthService} from '../../../../services/auth.service';

declare const gapi: any;

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.css']
})
export class UserInfoComponent implements OnInit {
  public googleServiceForm = new FormGroup({});

  public userInformationForm = new FormGroup({
    displayName: new FormControl(this.auth.loggedInUser.displayName,
      [Validators.required, Validators.minLength(2), Validators.maxLength(20)]),
    email: new FormControl(this.auth.loggedInUser.email, [Validators.required, Validators.email]),
    changePassword: new FormControl(false),
    newPassword: new FormControl('', [Validators.minLength(8), Validators.maxLength(60)]),
    newPasswordConfirm: new FormControl('', [Validators.minLength(8), Validators.maxLength(60)]),
    currentPassword: new FormControl('', [Validators.required]),
  });

  private permissions = [
    'profile',
    'email',
  ].join(' ');

  @ViewChild('googleAuthBtn') googleAuthBtnEl: ElementRef;

  private googleOAuth2: any;

  constructor(private auth: AuthService) {
  }

  ngOnInit() {
    gapi.load('auth2', function () {
      gapi.auth2.init();
    });
  }

  googleLogin() {
    let googleAuth = gapi.auth2.getAuthInstance();
    googleAuth.then(() => {
      googleAuth.signIn({scope: 'profile email'}).then(googleUser => {
        console.log(googleUser.getBasicProfile());
      });
    });
  }

  editInformation() {

  }

  editGoogleServiceSettings() {

  }


  authGoogle() {

  }
}
