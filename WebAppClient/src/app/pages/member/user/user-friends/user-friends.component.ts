import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../../../services/auth.service';
import {FriendService} from '../../../../services/friend.service';
import {AppConfig} from '../../../../app-config';
import {UserService} from '../../../../services/user.service';
import {Friend, FriendRequest, User} from '../../../../shared/models/user';
import {forkJoin} from 'rxjs';
import {take, tap} from 'rxjs/operators';
import {ConfirmationDialogComponent} from '../../../../shared/components/dialogs/confirmation-dialog/confirmation-dialog.component';
import {MatDialog, MatSnackBar} from '@angular/material';

@Component({
  selector: 'app-user-friends',
  templateUrl: './user-friends.component.html',
  styleUrls: ['./user-friends.component.css']
})
export class UserFriendsComponent implements OnInit {
  public querying = true;
  public receivedFriendRequests: FriendRequest[] = [];
  public sentFriendRequests: FriendRequest[] = [];
  public API_PATH: string = AppConfig.API_PATH;
  friends: Friend[] = [];

  constructor(public authService: AuthService, public friendService: FriendService,
              public userService: UserService, public dialog: MatDialog, public snackBar: MatSnackBar) {
  }

  ngOnInit() {
    this.update();
  }

  update() {
    this.querying = true;
    forkJoin(
      this.friendService.getReceivedRequests().pipe(tap(requests => this.receivedFriendRequests = requests.items), take(1)),
      this.friendService.getFriends().pipe(tap(friends => this.friends = friends.items), take(1)),
      this.friendService.getSentRequests().pipe(tap(requests => this.sentFriendRequests = requests.items), take(1))
    ).subscribe(() => this.querying = false);
  }

  responseFriendRequest(friendRequest: FriendRequest, approve: boolean) {
    this.querying = true;
    this.friendService.responseRequest(friendRequest.user.username, approve).subscribe(() => {
      this.querying = false;
      this.update();
      this.snackBar.open('Request responsed', 'DISMISS', {duration: 4000});
    }, err => this.querying = false);
  }

  deleteFriend(user: User) {
    this.dialog.open(ConfirmationDialogComponent, {
      data: {title: 'Confirmation', content: `Delete friend "${user.displayName}"?`}
    }).afterClosed().subscribe(res => {
      if (res) {
        this.querying = true;
        this.friendService.deleteFriend(user.username).subscribe(() => {
          this.querying = false;
          this.update();
          this.snackBar.open('Delete friend successfully', 'DISMISS', {duration: 4000});
        });
      }
    }, () => {
      this.querying = false;
      this.snackBar.open('Failed to delete', 'DISMISS', {duration: 4000});
    });
  }

  deleteSentRequest(friendRequest: FriendRequest) {
    this.querying = true;
    this.friendService.deleteSentRequest(friendRequest.targetUser.username).subscribe(() => {
      this.querying = false;
      this.update();
      this.snackBar.open('Delete request successfully', 'DISMISS', {duration: 4000});
    }, err => this.querying = false);
  }

}
