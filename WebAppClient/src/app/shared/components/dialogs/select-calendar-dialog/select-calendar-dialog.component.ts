import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef, MatSnackBar} from '@angular/material';
import {UserIntegrationService} from '../../../../services/user-integration.service';
import {tap} from 'rxjs/operators';

@Component({
  selector: 'app-select-calendar-dialog',
  templateUrl: './select-calendar-dialog.component.html',
  styleUrls: ['./select-calendar-dialog.component.css']
})
export class SelectCalendarDialogComponent implements OnInit {

  public querying = false;
  public existCalendarsId: string[] = [];
  public selectedCalendarId = null;

  constructor(public dialogRef: MatDialogRef<SelectCalendarDialogComponent>, private userIntegration: UserIntegrationService,
              public snackBar: MatSnackBar, @Inject(MAT_DIALOG_DATA) data) {
    this.existCalendarsId = data.existCalendarsId;
  }

  private _possibleCalendars: GoogleCalendar[] = [];

  get possibleCalendars() {
    return this._possibleCalendars.filter(calendar => this.existCalendarsId.indexOf(calendar.id) == -1);
  }

  ngOnInit(): void {
    this.update();
  }

  update() {
    this.querying = true;
    this.userIntegration.getPossibleCalendars().pipe(
      tap(calendars => this._possibleCalendars = calendars),
    ).subscribe(() => {
      this.querying = false;
    }, () => {
      this.snackBar.open('Failed to get calendars', 'DISMISS', {duration: 4000});
      this.dialogRef.close();
    });
  }


  confirm() {
    this.dialogRef.close(this.selectedCalendarId);
  }

}
