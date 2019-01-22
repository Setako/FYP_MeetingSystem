import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../../../services/auth.service';
import {FriendService} from '../../../../services/friend.service';
import {AppConfig} from '../../../../app-config';
import {UserService} from '../../../../services/user.service';
import {Friend, FriendRequest, User} from '../../../../shared/models/user';
import {query} from '@angular/animations';
import {forkJoin, Observable} from 'rxjs';
import {map, take} from 'rxjs/operators';
import {ConfirmationDialogComponent} from '../../../../shared/components/dialogs/confirmation-dialog/confirmation-dialog.component';
import {MatDialog} from '@angular/material';

@Component({
  selector: 'app-user-friends',
  templateUrl: './user-friends.component.html',
  styleUrls: ['./user-friends.component.css']
})
export class UserFriendsComponent implements OnInit {
  public querying = true;
  public receivedFriendRequests: FriendRequest[] = [];
  public API_PATH: string = AppConfig.API_PATH;
  friends: Friend[] = [];

  constructor(public authService: AuthService, public friendService: FriendService,
              public userService: UserService, public dialog: MatDialog) {
    this.update();
  }

  ngOnInit() {
  }

  update() {
    this.querying = true;
    forkJoin(
      this.friendService.getReceivedRequests().pipe(map(requests => this.receivedFriendRequests = requests.items), take(1)),
      this.friendService.getFriends().pipe(map(friends => this.friends = friends.items), take(1))
    ).subscribe(() => this.querying = false);
  }

  responseFriendRequest(friendRequest: FriendRequest, approve: boolean) {
    this.querying = true;
    this.friendService.responseRequest(friendRequest.user.username, approve).subscribe(() => {
      this.querying = false;
      this.update();
    }, err => this.querying = false);
  }

  deleteFriend(user: User) {
    this.dialog.open(ConfirmationDialogComponent, {
      data: {title: 'Confirmation', content: `Delete friend "${user.displayName}"?`}
    }).afterClosed().subscribe(res => {
      this.querying = true;
      this.friendService.deleteFriend(user.username).subscribe(() => {
        this.querying = false;
        this.update();
      });
    });
  }

}
