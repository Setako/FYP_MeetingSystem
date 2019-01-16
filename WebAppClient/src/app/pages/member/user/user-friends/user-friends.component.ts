import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../../../services/auth.service';
import {FriendService} from '../../../../services/friend.service';
import {AppConfig} from '../../../../app-config';
import {UserService} from '../../../../services/user.service';
import {Friend, FriendRequest} from '../../../../shared/models/user';
import {query} from '@angular/animations';
import {forkJoin, Observable} from 'rxjs';
import {map, take} from 'rxjs/operators';

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
              public userService: UserService) {
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
      this.update();
      this.querying = false;
    }, err => this.querying = false);
  }

}
