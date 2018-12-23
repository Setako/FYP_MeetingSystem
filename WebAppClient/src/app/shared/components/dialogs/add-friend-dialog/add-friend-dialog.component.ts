import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef, MatSnackBar} from '@angular/material';
import {FriendService} from '../../../../services/friend.service';
import {HttpErrorResponse} from '@angular/common/http';

@Component({
  selector: 'app-add-friend-dialog',
  templateUrl: './add-friend-dialog.component.html',
  styleUrls: ['./add-friend-dialog.component.css']
})
export class AddFriendDialogComponent implements OnInit {
  public querying = false;
  public friendRequestForm = new FormGroup(
    {
      username: new FormControl('', Validators.required)
    }
  );

  constructor(public dialogRef: MatDialogRef<AddFriendDialogComponent>, public friendService: FriendService, public snackBar: MatSnackBar) {
  }

  ngOnInit() {
  }

  sendRequest() {
    if (this.friendRequestForm.valid) {
      this.querying = true;
      this.friendService.sendRequest(this.friendRequestForm.value.username).subscribe(() => {
        this.querying = false;
        this.dialogRef.close(true);
      }, (err: HttpErrorResponse) => {
        this.querying = false;
        if (err.status === 404) {
          this.snackBar.open('Username not exist!', 'Dismiss', {duration: 4000});
        } else {
          this.snackBar.open(err.error.message, 'Dismiss', {duration: 4000});
        }
      });
    }
  }

}
