import {Component, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MeetingService} from '../../../../services/meeting.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MatSnackBar, MatStepper} from '@angular/material';
import {StepperSelectionEvent} from '@angular/cdk/stepper';
import {Meeting} from '../../../../shared/models/meeting';

@Component({
  selector: 'app-meeting-edit',
  templateUrl: './meeting-edit.component.html',
  styleUrls: ['./meeting-edit.component.css']
})
export class MeetingEditComponent implements OnInit {
  today: Date = new Date();
  queryingAction = null;
  @ViewChild('stepper') stepper: MatStepper;

  public meeting: Meeting;

  public basicForm = new FormGroup({
    title: new FormControl('', [Validators.required]),
    length: new FormControl('', [Validators.required]),
    type: new FormControl('', [Validators.required]),
    priority: new FormControl('', [Validators.required]),
    location: new FormControl('', [Validators.required]),
    description: new FormControl('')
  });

  get timeAutoComplete() {
    return Array.from(new Array(48), (x, i) => i)
      .map((x) => ({hour: Math.floor(x / 2), minute: (x % 2) * 30}))
      .map((t) => `${(t.hour + '').padStart(2, '0')}:${(t.minute + '').padStart(2, '0')}`);
  }

  constructor(private activatedRoute: ActivatedRoute, private  meetingService: MeetingService,
              private snackBar: MatSnackBar, private router: Router) {
  }

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe(paramMap => {
      this.updateMeeting(paramMap.get('id'));
    });
  }

  saveStepState(event: StepperSelectionEvent) {
    console.log(event);
    switch (event.previouslySelectedIndex) {
      case 0:
        if (!this.basicForm.valid) {
          this.snackBar.open('Some data of basic information are invalid, not saved!', 'Dismiss', {duration: 4000});
        } else {

          this.meeting.title = this.basicForm.value.title;
          this.meeting.length = this.basicForm.value.length;
          this.meeting.type = this.basicForm.value.type;
          this.meeting.priority = parseInt(this.basicForm.value.title, 10);
          this.meeting.location = this.basicForm.value.location;
          this.meeting.description = this.basicForm.value.description;

          this.queryingAction = 'Updating basic information';
          this.meetingService.saveMeeting(this.meeting).subscribe(
            () => {
              this.queryingAction = null;
              this.snackBar.open('Data saved!', 'Dismiss', {duration: 4000});
            }, () => {
              this.queryingAction = null;
              this.snackBar.open('Data failed to save!', 'Dismiss', {duration: 4000});
            });
        }
    }
  }

  private updateMeeting(meetingId: string) {
    this.queryingAction = 'Getting meeting data';
    this.meetingService.getMeeting(meetingId).subscribe(
      meeting => {
        this.basicForm.patchValue({
          title: meeting.title,
          length: meeting.length,
          type: meeting.type,
          priority: meeting.priority + '',
          location: meeting.location,
          description: meeting.description
        });
        this.queryingAction = null;
        this.meeting = meeting;
      },
      err => {
        this.snackBar.open('Meeting not exist', 'Dismiss', {duration: 4000});
        this.queryingAction = null;
        this.router.navigate(['/member/meeting']);
      }
    );
  }

}
