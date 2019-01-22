import {Component, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MeetingService} from '../../../../services/meeting.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog, MatSelectionList, MatSnackBar, MatStepper} from '@angular/material';
import {Meeting} from '../../../../shared/models/meeting';
import {Millisecond} from '../../../../utils/time-unit';
import {ObjectFilter} from '../../../../utils/object-filter';
import {SelectFriendsDialogComponent} from '../../../../shared/components/dialogs/select-friends-dialog/select-friends-dialog.component';
import {User} from '../../../../shared/models/user';
import {ConfirmationDialogComponent} from '../../../../shared/components/dialogs/confirmation-dialog/confirmation-dialog.component';
import {GoogleOauthService} from '../../../../services/google/google-oauth.service';
import {mapTo} from 'rxjs/operators';

@Component({
  selector: 'app-meeting-edit',
  templateUrl: './meeting-edit.component.html',
  styleUrls: ['./meeting-edit.component.css']
})
export class MeetingEditComponent implements OnInit {
  public Step = {
    Basic: {
      filter: ObjectFilter.include(['title', 'length', 'type', 'priority', 'location', 'description', 'id'])
    }
  };

  queryingAction = 'Getting data';

  @ViewChild('stepper') stepper: MatStepper;

  @ViewChild('selectFriend') selectFriend: MatSelectionList;

  public meeting: Meeting;
  public meetingParticipantFriends: User[] = [];
  public meetingParticipantEmails = '';


  public pickedFolders: string[] = [];

  public basicForm = new FormGroup({
    title: new FormControl('', [Validators.required]),
    length: new FormControl('', [Validators.required]),
    type: new FormControl('', [Validators.required]),
    priority: new FormControl('', [Validators.required]),
    location: new FormControl('', [Validators.required]),
    description: new FormControl('')
  });

  constructor(private activatedRoute: ActivatedRoute, private  meetingService: MeetingService,
              private snackBar: MatSnackBar, private router: Router,
              private dialog: MatDialog, private googleOauthService: GoogleOauthService) {
  }

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe(paramMap => {
      this.updateMeeting(paramMap.get('id'));
    });
  }

  saveStepState(previousStepNum: number, step: any) {
    switch (previousStepNum) {
      case 0:
        if (!this.basicForm.valid) {
          this.snackBar.open('Some data of basic information are invalid, not saved!', 'Dismiss', {duration: 4000});
        } else {

          this.meeting.title = this.basicForm.value.title;
          this.meeting.length = this.basicForm.value.length * Millisecond.Hour;
          this.meeting.type = this.basicForm.value.type;
          this.meeting.priority = parseInt(this.basicForm.value.title, 10);
          this.meeting.location = this.basicForm.value.location;
          this.meeting.description = this.basicForm.value.description;

          this.queryingAction = 'Updating basic information';
          this.meetingService.saveMeeting(step.filter.filter(this.meeting)).subscribe(
            () => {
              this.queryingAction = null;
              this.snackBar.open('Data saved!', 'Dismiss', {duration: 4000});
            }, () => {
              this.queryingAction = null;
              this.snackBar.open('Data failed to save!', 'Dismiss', {duration: 4000});
            });
        }
        break;
      case 1:
        this.queryingAction = 'Updating participants';
        this.meetingService.saveMeetingParticipants({
          id: this.meeting.id,
          invitations: {
            friends: this.meetingParticipantFriends.map(user => user.username),
            emails: this.meetingParticipantEmails.split('\n').filter(email => email.trim().length > 0)
          }
        }).pipe(mapTo(this.updateMeeting(this.meeting.id))).subscribe(
          () => {
            this.queryingAction = null;
            this.snackBar.open('Data saved!', 'Dismiss', {duration: 4000});
          }, () => {
            this.queryingAction = null;
            this.snackBar.open('Data failed to save!', 'Dismiss', {duration: 4000});
          });
        break;
      case 3:
        this.queryingAction = 'Updating planned start time';
        this.meetingService.saveMeeting({
          id: this.meeting.id,
          plannedStartTime: this.meeting.plannedStartTime
        } as Meeting).pipe(mapTo(this.updateMeeting(this.meeting.id))).subscribe(
          () => {
            this.queryingAction = null;
            this.snackBar.open('Data saved!', 'Dismiss', {duration: 4000});
          }, () => {
            this.queryingAction = null;
            this.snackBar.open('Data failed to save!', 'Dismiss', {duration: 4000});
          });
    }
  }

  public deleteSelectedFriendParticipants() {
    const deletingUsers = this.selectFriend.selectedOptions.selected.map(opt => opt.value);
    if (deletingUsers.length === 0) {
      this.dialog.open(ConfirmationDialogComponent, {
        data: {title: 'Confirmation', content: 'Delete all participants?'}
      }).afterClosed().subscribe(res => {
        this.meetingParticipantFriends = res ? [] : this.meetingParticipantFriends;
      });

    } else {
      this.meetingParticipantFriends = this.meetingParticipantFriends
        .filter(friend => deletingUsers.indexOf(friend) === -1);
    }
  }

  public selectFriendParticipants() {
    this.dialog.open(SelectFriendsDialogComponent, {
      data: {
        title: 'Add friends as participant',
        hiddenFriendsUsername: this.meetingParticipantFriends.map(user => user.username)
      }
    }).afterClosed().subscribe((friends: User[]) => {
      if (friends != null) {
        this.meetingParticipantFriends = this.meetingParticipantFriends.concat(friends);
      }
    });
  }

  public updateMeeting(meetingId: string) {
    this.queryingAction = 'Getting meeting data';
    this.meetingService.getMeeting(meetingId).subscribe(
      meeting => {
        this.basicForm.patchValue({
          title: meeting.title,
          length: meeting.length / Millisecond.Hour,
          type: meeting.type,
          priority: meeting.priority + '',
          location: meeting.location,
          description: meeting.description
        });

        // Update participants
        this.meetingParticipantFriends = meeting.invitations
          .filter(invitation => invitation.user != null && invitation.email == null)
          .map(invitation => invitation.user);

        this.meetingParticipantEmails = meeting.invitations
          .filter(invitation => invitation.email != null)
          .map(invitation => invitation.email).join('\n');

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

  addFolder() {
    this.googleOauthService.gapiInit().subscribe(() => {
      console.log('ok');
    }, err => {
      console.log('e ' + err);
    }, () => {
      console.log('c');
      this.googleOauthService.doRequest<any>(
        (token) => this.googleOauthService.test(token),
      ).subscribe(
        (res) => {
          res.docs.map(doc => doc.name).forEach((doc) => this.pickedFolders.push(doc));
        }, err => console.log(err)
      );

    });
  }
}
