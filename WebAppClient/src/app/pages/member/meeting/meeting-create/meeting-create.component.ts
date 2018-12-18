import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MeetingService} from '../../../../services/meeting.service';
import {Millisecond} from '../../../../utils/TimeUnit';
import {Meeting} from '../../../../shared/models/meeting';
import {MatSnackBar} from '@angular/material';
import {Router} from '@angular/router';

@Component({
  selector: 'app-meeting-create',
  templateUrl: './meeting-create.component.html',
  styleUrls: ['./meeting-create.component.css']
})
export class MeetingCreateComponent implements OnInit {
  public querying = false;
  public basicForm = new FormGroup({
    title: new FormControl('', [Validators.required]),
    length: new FormControl('', [Validators.required]),
    type: new FormControl('', [Validators.required]),
    priority: new FormControl('', [Validators.required]),
    location: new FormControl('', [Validators.required]),
    description: new FormControl('')
  });

  constructor(private meetingService: MeetingService, private snackBar: MatSnackBar,
              private router: Router) {
  }

  ngOnInit() {
  }

  create() {
    if (this.basicForm.valid) {
      this.querying = true;
      this.meetingService.createMeeting({
        title: this.basicForm.value.title,
        length: this.basicForm.value.length * Millisecond.Hour,
        type: this.basicForm.value.type,
        priority: this.basicForm.value.priority,
        location: this.basicForm.value.location,
        description: this.basicForm.value.description
      } as Meeting).subscribe(
        () => {
          this.querying = false;
          this.snackBar.open('Meeting created successfully', 'Dismiss', {duration: 4000});
          this.router.navigate(['/member/meeting']);
        },
        (err) => {
          this.querying = false;
          this.snackBar.open('Oops, cannot create meeting', 'Dismiss', {duration: 4000});
        }
      );
      // this.auth.login(this.loginForm.value.username, this.loginForm.value.password)
      //   .pipe(finalize(() => this.querying = false))
      //   .subscribe(
      //     (res) => {
      //       this.router.navigate(['/member']);
      //       this.snackBar.open('Login Success', 'Dismiss', {duration: 4000});
      //     },
      //     (err) => {
      //       console.log(err);
      //       this.snackBar.open('Username or password wrong', 'Dismiss', {duration: 4000});
      //     }
      //   );
    }
  }

}
