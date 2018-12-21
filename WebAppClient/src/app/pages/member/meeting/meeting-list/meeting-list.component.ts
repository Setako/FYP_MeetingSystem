import {Component, OnInit} from '@angular/core';
import {PageEvent} from '@angular/material';
import {Meeting, MeetingStatus} from '../../../../shared/models/meeting';
import {MeetingService} from '../../../../services/meeting.service';
import {ql} from '@angular/core/src/render3';
import {Observable, Subscription} from 'rxjs';
import {ListResponse} from '../../../../utils/ListResponse';
import {AuthService} from '../../../../services/auth.service';

@Component({
  selector: 'app-meeting-list',
  templateUrl: './meeting-list.component.html',
  styleUrls: ['./meeting-list.component.css']
})
export class MeetingListComponent implements OnInit {
  public pageSizeOptions: number[] = [2, 5, 10, 20];
  public pageIndex = 0;
  public pageSize = 5;
  public meetingsLength = 0;
  public meetingList: Meeting[];
  public meetingListQuerySubscription: Subscription = null;

  public availableStatus = ['draft', 'planned', 'confirmed', 'cancelled', 'started', 'ended', 'deleted'];

  public hostedByMe = true;
  public hostedByOther = true;
  public status: MeetingStatus[] = ['draft'];

  constructor(public meetingService: MeetingService, public authService: AuthService) {
  }

  ngOnInit() {
    this.updateList();
  }

  public changeStatus(status: string) {
    switch (status) {
      case 'all':
        this.status = this.availableStatus as MeetingStatus[];
        break;
      default:
        this.status = [status] as MeetingStatus[];
    }
    this.updateList();
  }

  updatePageNum(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateList();
  }

  public updateList() {
    if (this.meetingListQuerySubscription != null) {
      this.meetingListQuerySubscription.unsubscribe();
      this.meetingListQuerySubscription = null;
    }
    this.meetingListQuerySubscription = this.meetingService.findMeetings({
      hostedByMe: this.hostedByMe,
      hostedByOther: this.hostedByOther,
      status: this.status
    }, this.pageSize, this.pageIndex + 1).subscribe(
      res => {
        this.meetingList = res.items;
        this.meetingsLength = res.length;
        this.meetingListQuerySubscription = null;
      },
      err => this.meetingListQuerySubscription = null
    );
  }
}
