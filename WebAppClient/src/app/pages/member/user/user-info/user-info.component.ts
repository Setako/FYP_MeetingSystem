import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AuthService} from '../../../../services/auth.service';

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.css']
})
export class UserInfoComponent implements OnInit {
  public userInformationForm = new FormGroup({
    displayName: new FormControl(this.auth.loggedInUser.displayName,
      [Validators.required, Validators.minLength(4), Validators.maxLength(20)]),
    email: new FormControl(this.auth.loggedInUser.email, [Validators.required, Validators.email]),
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
