import {Component, Inject, OnInit} from '@angular/core';
import {MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef, MatSnackBar} from '@angular/material';
import {Meeting, MeetingAttendance} from '../../../models/meeting';
import {AuthService} from '../../../../services/auth.service';
import {MeetingService} from '../../../../services/meeting.service';

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

  constructor(public bottomSheetRef: MatBottomSheetRef<MeetingOperationsBottomSheetsComponent>,
              @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
              public authService: AuthService, public meetingService: MeetingService,
              public snackBar: MatSnackBar) {
    this.meeting = data.meeting;
    this.deletedCallback = data.deletedCallback;
    this.refreshCallback = data.refreshCallback;


    console.log(this.meeting.attendance);
    this.attendance = this.meeting.attendance.get(authService.loggedInUser.username);
    this.isOwner = this.meeting.owner.username === authService.loggedInUser.username;
  }

  ngOnInit() {
  }

  toggleMarkCalendar(event: MouseEvent) {
    this.meetingService.toggleMarkMeetingCalendar(this.meeting)
      .subscribe(() => {
        this.refreshCallback();
        this.snackBar.open('Calendar updated!', 'Dismiss', {duration: 4000});
      });
    this.bottomSheetRef.dismiss();
    event.preventDefault();
  }

  delete(event: MouseEvent) {
    this.meetingService.deleteMeetingDraft(this.meeting)
      .subscribe(() => {
        this.deletedCallback();
        this.snackBar.open('Meeting delete success!', 'Dismiss', {duration: 4000});
      });
    event.preventDefault();
    this.bottomSheetRef.dismiss();
  }
}
