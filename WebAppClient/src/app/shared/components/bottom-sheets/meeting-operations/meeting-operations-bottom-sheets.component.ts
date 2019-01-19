import {Component, Inject, OnInit} from '@angular/core';
import {MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef, MatDialog, MatSnackBar} from '@angular/material';
import {Meeting, MeetingAttendance} from '../../../models/meeting';
import {AuthService} from '../../../../services/auth.service';
import {MeetingService} from '../../../../services/meeting.service';
import {ConfirmationDialogComponent} from '../../dialogs/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-meeting-operations',
  templateUrl: './meeting-operations-bottom-sheets.component.html',
  styleUrls: ['./meeting-operations-bottom-sheets.component.css']
})
export class MeetingOperationsBottomSheetsComponent implements OnInit {
  public attendance: MeetingAttendance;
  public isOwner: boolean;
  public meeting: Meeting;
  public deletedCallback: () => any;
  public refreshCallback: () => any;
  public editAvailableStatus = ['draft', 'planned', 'confirmed'];
  public cancelableStatus = ['planned', 'confirmed'];
  public Object = Object;
  public pushStatusProgressMap = {
    'draft': {
      to: 'planned',
      action: 'Confirm draft and send invitation',
      hints: null,
      icon: 'done'
    },
    'planned': {
      to: 'confirmed',
      action: 'Force confirm meeting',
      hints: 'People who have no response on invitation will treat as not attend',
      icon: 'gavel'
    }
  };

  constructor(public bottomSheetRef: MatBottomSheetRef<MeetingOperationsBottomSheetsComponent>,
              @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
              public authService: AuthService, public meetingService: MeetingService,
              public snackBar: MatSnackBar,
              public dialog: MatDialog) {
    this.meeting = data.meeting;
    this.deletedCallback = data.deletedCallback;
    this.refreshCallback = data.refreshCallback;


    this.attendance = this.meeting.attendance == null ? null : this.meeting.attendance.get(authService.loggedInUser.username);
    this.isOwner = this.meeting.owner.username === authService.loggedInUser.username;
  }

  ngOnInit() {
  }

  toggleMarkCalendar(event: MouseEvent) {
    this.bottomSheetRef.dismiss();
    this.meetingService.toggleMarkMeetingCalendar(this.meeting)
      .subscribe(() => {
        this.refreshCallback();
        this.snackBar.open('Calendar updated!', 'Dismiss', {duration: 4000});
      });
    this.bottomSheetRef.dismiss();
    event.preventDefault();
  }

  pushStatusProgress(event: MouseEvent) {
    this.bottomSheetRef.dismiss();
    this.meetingService.turnMeetingStatus(this.meeting, this.pushStatusProgressMap[this.meeting.status].to).subscribe(
      () => {
        this.refreshCallback();
        this.snackBar.open('Status updated!', 'Dismiss', {duration: 4000});
      }
    );
    event.preventDefault();
  }

  delete(event: MouseEvent) {
    this.bottomSheetRef.dismiss();
    this.dialog.open(ConfirmationDialogComponent,
      {data: {title: 'Confirmation', content: `Are you sure to delete ${this.meeting.title}`}}
    ).afterClosed().subscribe(res => {
      if (res) {
        this.meetingService.deleteMeetingDraft(this.meeting)
          .subscribe(() => {
            this.deletedCallback();
            this.snackBar.open('Meeting delete success!', 'Dismiss', {duration: 4000});
          });
        this.bottomSheetRef.dismiss();
      }
    });
    event.preventDefault();
  }

  cancel(event: MouseEvent) {
    this.bottomSheetRef.dismiss();
    this.dialog.open(ConfirmationDialogComponent,
      {data: {title: 'Confirmation', content: `Are you sure to cancel ${this.meeting.title}`}}
    ).afterClosed().subscribe(res => {
      if (res) {
        this.meetingService.turnMeetingStatus(this.meeting, 'cancelled')
          .subscribe(() => {
            this.deletedCallback();
            this.snackBar.open('Meeting cancelled!', 'Dismiss', {duration: 4000});
          });
        this.bottomSheetRef.dismiss();
      }
    });
    event.preventDefault();
  }
}
