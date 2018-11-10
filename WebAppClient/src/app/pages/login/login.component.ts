import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  public loginFields = {
    username: '',
    password: ''
  };
  public registerFields = {
    email: '',
    username: '',
    password: '',
    passwordRepeat: ''
  };
  public querying = false;

  constructor(private auth: AuthService) {
  }

  ngOnInit() {
  }

  login() {
    this.querying = true;
    this.auth.login(this.loginFields.username, this.loginFields.password).subscribe(
      (res) => {
        console.log(res);
        this.querying = false;
      },
      (err) => {
        console.log(err);
        this.querying = false;
      });
  }

  register() {
  }

}
