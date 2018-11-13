import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AuthService} from '../../../../services/auth.service';

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.css']
})
export class UserInfoComponent implements OnInit {
  public googleServiceForm = new FormGroup({
  });

  public userInformationForm = new FormGroup({
    displayName: new FormControl(this.auth.loggedInUser.displayName,
      [Validators.required, Validators.minLength(2), Validators.maxLength(20)]),
    email: new FormControl(this.auth.loggedInUser.email, [Validators.required, Validators.email]),
    changePassword: new FormControl(false),
    newPassword: new FormControl('', [Validators.minLength(8), Validators.maxLength(60)]),
    newPasswordConfirm: new FormControl('', [Validators.minLength(8), Validators.maxLength(60)]),
    currentPassword: new FormControl('', [Validators.required]),
  });

  constructor(private auth: AuthService) {
  }

  ngOnInit() {
  }

  editInformation() {

  }

  editGoogleServiceSettings() {

  }


}
