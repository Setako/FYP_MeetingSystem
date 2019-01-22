import {Component, OnInit} from '@angular/core';
import {MeetingService} from '../../../services/meeting.service';
import {MatBottomSheet, MatSnackBar, PageEvent} from '@angular/material';
import {AuthService} from '../../../services/auth.service';
import {Meeting, MeetingSearchingFilter} from '../../../shared/models/meeting';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-meeting-invitations',
  templateUrl: './meeting-invitations.component.html',
  styleUrls: ['./meeting-invitations.component.css']
})
export class MeetingInvitationsComponent implements OnInit {
  public meetingList: Meeting[];
  public meetingListQuerySubscription: Subscription = null;
  public pageSizeOptions: number[] = [5, 10, 20];
  public pageIndex = 0;
  public pageSize = 5;
  public meetingsLength = 0;
  public invitingFromFriend = true;
  public querying = true;

  constructor(public meetingService: MeetingService, public authService: AuthService, public bottomSheet: MatBottomSheet,
              public snackBar: MatSnackBar) {

    this.updateList();
  }

  ngOnInit() {
    this.updateList();
  }

  updatePageNum(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateList();
  }

  public updateList() {
    this.meetingListQuerySubscription = this.meetingService.findMeetings(
      {invitingMe: true} as MeetingSearchingFilter,
      this.pageSize, this.pageIndex + 1)
      .subscribe(
        res => {
          this.meetingList = res.items;
          this.meetingsLength = res.length;
          this.meetingListQuerySubscription = null;
        },
        err => {
          this.snackBar.open(err);
          this.meetingListQuerySubscription = null;
        }
      );
  }

  public changeFrom(status: string) {
    switch (status) {
      case 'From friends':
        this.invitingFromFriend = true;
        break;
      case 'From strangers':
        this.invitingFromFriend = false;
        break;
      case 'All':
        this.invitingFromFriend = undefined;
    }
    this.updateList();
  }

  public responseInvitation(meeting: Meeting, accept: boolean) {
    this.meetingListQuerySubscription = this.meetingService.responseInvitation(meeting.id, accept).subscribe(() => {
      this.meetingListQuerySubscription = null;
      this.updateList();
    }, err => {
      this.snackBar.open('Failed to response invitation', 'Dismiss', {duration: 4000});
      this.meetingListQuerySubscription = null;
      this.updateList();
    });
  }


}
