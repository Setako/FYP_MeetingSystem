import {Component, EventEmitter, NgZone, OnInit, Output} from '@angular/core';
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

  @Output()
  statusUpdate: EventEmitter<any> = new EventEmitter();

  constructor(private googleOauthService: GoogleOauthService, private  snackBar: MatSnackBar, private ngZone: NgZone) {
  }

  ngOnInit() {
    this.updateAuthStatus();
  }

  googleLogin() {
    this.queryingAction = 'Google auth process in another window...';
    this.querying = true;
    this.googleOauthService.connectGoogle().subscribe(
      token => {
        this.ngZone.run(() => {
          this.snackBar.open('Connected successfully', 'Dismiss', {duration: 3000});
          this.querying = false;
          this.updateAuthStatus();
          this.statusUpdate.emit();
        });
      }, (err) => {
        this.ngZone.run(() => {
          this.snackBar.open(err.message, 'Dismiss', {duration: 3000});
          this.querying = false;
          this.statusUpdate.emit();
        });
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
        console.log(err);
        this.querying = false;
        this.auth = false;
      },
      () => {
        this.querying = false;
        this.auth = true;
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
