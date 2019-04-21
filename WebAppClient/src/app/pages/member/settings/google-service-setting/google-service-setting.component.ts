import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {GoogleOauthService} from '../../../../services/google/google-oauth.service';
import {MatSnackBar} from '@angular/material';

@Component({
  selector: 'app-google-service-setting',
  templateUrl: './google-service-setting.component.html',
  styleUrls: ['./google-service-setting.component.css']
})
export class GoogleServiceSettingComponent implements OnInit {
  public querying = true;
  public queryingAction: string;
  public auth: boolean;

  constructor(private googleOauthService: GoogleOauthService, private  snackBar: MatSnackBar, private cdr: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.updateAuthStatus();
  }

  googleLogin() {
    this.queryingAction = 'Google auth process in another window...';
    this.querying = true;
    this.googleOauthService.connectGoogle().subscribe(
      token => {
        this.snackBar.open('Connected successfully', 'Dismiss', {duration: 3000});
        this.querying = false;
        this.updateAuthStatus();
        this.cdr.detectChanges();
      }, (err) => {
        this.snackBar.open(err.message, 'Dismiss', {duration: 3000});
        this.querying = false;
        this.cdr.detectChanges();
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
        console.log('success');
      },
      (err) => {
        console.log(err);
        this.querying = false;
        this.auth = false;
      },
      () => {
        this.querying = false;
        this.auth = true;
        console.log('success');
      }
    );
  }

  googleDisconnect() {
    this.querying = true;
    this.queryingAction = 'Disconnecting...';
    this.googleOauthService.disconnectGoogle().subscribe(() => {
      this.querying = false;
      this.updateAuthStatus();
    });
  }
}
