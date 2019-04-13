import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {UserIntegrationService} from '../../../../services/user-integration.service';
import {forkJoin} from 'rxjs';
import {tap} from 'rxjs/internal/operators/tap';
import {AuthService} from '../../../../services/auth.service';

@Component({
  selector: 'app-calendar-setting',
  templateUrl: './calendar-setting.component.html',
  styleUrls: ['./calendar-setting.component.scss']
})
export class CalendarSettingComponent implements OnInit {
  private possibleCalendars: GoogleCalendar[] = [];
  private querying = false;

  constructor(private userIntegration: UserIntegrationService, private auth: AuthService) {
  }

  ngOnInit(): void {
  }

  update() {
    this.querying = true;
    forkJoin([
      this.userIntegration.getPossibleCalendars().pipe(tap(calendars => this.possibleCalendars = calendars)),
      this.auth.updateUserInfo()
    ]).subscribe(() => this.querying = false);
  }

  saveSetting(): void {

  }

}

