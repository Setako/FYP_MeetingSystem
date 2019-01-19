import {Component, OnInit} from '@angular/core';
import {GoogleOauthService} from '../../../../services/google/google-oauth.service';
import {MatSnackBar} from '@angular/material';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-google-service-setting',
  templateUrl: './google-service-setting.component.html',
  styleUrls: ['./google-service-setting.component.css']
})
export class GoogleServiceSettingComponent implements OnInit {
  public querying = false;
  public queryingAction: string;
  public auth: boolean;

  constructor(private googleOauthService: GoogleOauthService, private  snackBar: MatSnackBar) {
  }

  ngOnInit() {
  }

  googleLogin() {
    this.queryingAction = 'Google auth process in another window...';
    this.querying = true;
    this.googleOauthService.connectGoogle().subscribe(
      token => {
        this.snackBar.open(token);
        // console.log(token);
        this.querying = false;
      }, (err) => {
        this.snackBar.open(err);
        console.log(err);
        this.querying = false;
      }
    );
  }

  updateAuthStatus() {
    this.querying = true;
    this.queryingAction = 'Updating auth status...';
    this.googleOauthService.accessToken.subscribe(
      () => {
        this.querying = false;
        this.auth = true;
      },
      (err) => {
        this.querying = false;
        this.auth = false;
      }
    );
  }
}
