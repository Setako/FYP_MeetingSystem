import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {MatSnackBar} from '@angular/material';
import {finalize} from 'rxjs/operators';
import {Router} from '@angular/router';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {User} from '../../shared/models/user';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  public loginForm = new FormGroup({
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required])
  });
  public registerForm = new FormGroup({
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    passwordConfirm: new FormControl(''),
  }, {validators: [this.checkPasswordRepeat]});
  public querying = false;

  constructor(private auth: AuthService, private snackBar: MatSnackBar, private router: Router) {
  }

  ngOnInit() {
    if (this.auth.isLoggedIn) {
      this.router.navigate(['/member']);
    }
  }

  login() {
    if (this.loginForm.valid) {
      this.querying = true;
      this.auth.login(this.loginForm.value.username, this.loginForm.value.password)
        .pipe(finalize(() => this.querying = false))
        .subscribe(
          (res) => {
            this.router.navigate(['/member']);
            this.snackBar.open('Login Success', 'Dismiss', {duration: 4000});
          },
          (err) => {
            console.log(err);
            this.snackBar.open('Username or password wrong', 'Dismiss', {duration: 4000});
          }
        );
    }
  }

  register() {
    if (this.registerForm.valid) {
      this.querying = true;
      this.auth.register({
        username: this.registerForm.value.username,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password
      } as User)
        .pipe(finalize(() => this.querying = false))
        .subscribe(
          (res) => {
            this.router.navigate(['/member']);
            this.snackBar.open('Register Success', 'Dismiss', {duration: 4000});
          },
          (err) => {
            this.snackBar.open('Register failed, ' + err.error.message, 'Dismiss', {duration: 5000});
          }
        );
    }
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

}
