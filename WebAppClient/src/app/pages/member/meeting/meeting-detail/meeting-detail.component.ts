import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MeetingService} from '../../../../services/meeting.service';
import {Meeting, priorityDisplay} from '../../../../shared/models/meeting';
import {MatBottomSheet, MatSnackBar} from '@angular/material';
import {
  MeetingOperationsBottomSheetsComponent
} from '../../../../shared/components/bottom-sheets/meeting-operations/meeting-operations-bottom-sheets.component';

@Component({
  selector: 'app-meeting-detail',
  templateUrl: './meeting-detail.component.html',
  styleUrls: ['./meeting-detail.component.css']
})
export class MeetingDetailComponent implements OnInit {
  public querying = false;
  public meeting: Meeting = null;
  public priorityDisplay = priorityDisplay;

  constructor(private activatedRoute: ActivatedRoute, private  meetingService: MeetingService,
              private snackBar: MatSnackBar, private router: Router, private bottomSheet: MatBottomSheet) {
  }

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe(paramMap => {
      this.updateMeeting(paramMap.get('id'));
    });
  }

  private updateMeeting(meetingId: string) {
    this.querying = true;
    this.meetingService.getMeeting(meetingId).subscribe(
      meeting => {
        this.meeting = meeting;
        this.querying = false;
      },
      err => {
        this.snackBar.open('Meeting not exist', 'Dismiss', {duration: 4000});
        this.querying = false;
        this.router.navigate(['/member/meeting']);
      }
    );
  }

  moreOperation(meeting: Meeting) {
    this.bottomSheet.open(MeetingOperationsBottomSheetsComponent, {
      data: {
        meeting: meeting,
        deletedCallback: () => this.router.navigate(['member/meeting']),
        refreshCallback: () => this.updateMeeting(meeting.id),
      }
    });
  }
}
