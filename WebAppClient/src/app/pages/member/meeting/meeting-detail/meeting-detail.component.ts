import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MeetingService} from '../../../../services/meeting.service';
import {Meeting} from '../../../../shared/models/meeting';
import {MatSnackBar} from '@angular/material';

@Component({
  selector: 'app-meeting-detail',
  templateUrl: './meeting-detail.component.html',
  styleUrls: ['./meeting-detail.component.css']
})
export class MeetingDetailComponent implements OnInit {
  public querying = false;
  public meeting: Meeting = null;

  constructor(private activatedRoute: ActivatedRoute, private  meetingService: MeetingService,
              private snackBar: MatSnackBar, private router: Router) {
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
        console.log('ok');
        this.meeting = meeting;
        this.querying = false;
      },
      err => {
        console.log('ok');
        this.snackBar.open('Meeting not exist', 'Dismiss', {duration: 4000});
        this.querying = false;
        this.router.navigate(['/member/meeting']);
      }
    );
  }
}
