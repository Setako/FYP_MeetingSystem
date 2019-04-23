import {Component, OnInit} from '@angular/core';
import {UserIntegrationService} from '../../../../services/user-integration.service';
import {tap} from 'rxjs/internal/operators/tap';
import {AuthService} from '../../../../services/auth.service';
import {flatMap} from 'rxjs/operators';
import {MatDialog, MatSnackBar} from '@angular/material';
import {SelectCalendarDialogComponent} from '../../../../shared/components/dialogs/select-calendar-dialog/select-calendar-dialog.component';
import {User} from 'src/app/shared/models/user';
import {UserService} from '../../../../services/user.service';

@Component({
  selector: 'app-calendar-setting',
  templateUrl: './calendar-setting.component.html',
  styleUrls: ['./calendar-setting.component.scss']
})
export class CalendarSettingComponent implements OnInit {
  possibleCalendars: GoogleCalendar[] = [];
  querying = false;
  markEventOnCalendarId: string;
  connectedGoogle = false;
  calendarImportances: {
    carlendarId: string,
    importance: number
  }[] = [];

  constructor(private userIntegration: UserIntegrationService, private auth: AuthService, private snackBar: MatSnackBar,
              private dialog: MatDialog, private userService: UserService) {
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
      this.calendarImportances = this.auth.loggedInUser.setting.calendarImportance;
      this.connectedGoogle = true;
      this.querying = false;
    }, () => {
      this.querying = false;
      this.connectedGoogle = false;
    });
  }

  addCalendar() {
    this.dialog.open(SelectCalendarDialogComponent, {
      data: {
        existCalendarsId: this.calendarImportances.map(entry => entry.carlendarId)
      }
    }).afterClosed().subscribe((calendarId: string) => {
      if (calendarId != null) {
        this.calendarImportances.push({carlendarId: calendarId, importance: 1});
      }
    });
  }

  getCalendarSummary(calendarId) {
    const calendar = this.possibleCalendars.filter(filtering => filtering.id === calendarId)[0];
    return calendar == null ? 'Unknow calendar' : calendar.summary;
  }

  saveSetting(): void {
    this.querying = true;

    const user: User = {
      username: this.auth.loggedInUser.username,
      setting: {
        markEventOnCalendarId: this.markEventOnCalendarId,
        calendarImportance: this.calendarImportances
      }
    };

    this.userService.editUser(user).subscribe(() => {
      this.querying = false;
      this.snackBar.open('Update success', 'DISMISS', {duration: 4000});
    });
  }

}

