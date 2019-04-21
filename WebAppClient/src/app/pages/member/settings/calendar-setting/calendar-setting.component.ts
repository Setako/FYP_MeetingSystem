import {Component, OnInit} from '@angular/core';
import {UserIntegrationService} from '../../../../services/user-integration.service';
import {tap} from 'rxjs/internal/operators/tap';
import {AuthService} from '../../../../services/auth.service';
import {flatMap} from 'rxjs/operators';
import {MatSnackBar} from '@angular/material';

@Component({
  selector: 'app-calendar-setting',
  templateUrl: './calendar-setting.component.html',
  styleUrls: ['./calendar-setting.component.scss']
})
export class CalendarSettingComponent implements OnInit {
  private possibleCalendars: GoogleCalendar[] = [];
  private querying = false;
  private markEventOnCalendarId: string;

  constructor(private userIntegration: UserIntegrationService, private auth: AuthService, private snackBar: MatSnackBar) {
  }

  ngOnInit(): void {
    this.update();
  }

  update() {
    this.querying = true;
    this.userIntegration.getPossibleCalendars().pipe(
      tap(calendars => this.possibleCalendars = calendars),
      flatMap(_ => this.auth.updateUserInfo())
    ).subscribe(() => {
      this.markEventOnCalendarId = this.auth.loggedInUser.setting.markEventOnCalendarId;
      this.querying = false;
    }, () => {
      this.snackBar.open('Failed to update setting', 'DISMISS', {duration: 4000});
    });
  }

  saveSetting(): void {

  }

}

