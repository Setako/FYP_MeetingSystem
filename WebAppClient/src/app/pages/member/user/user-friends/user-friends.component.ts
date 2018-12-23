import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../../../services/auth.service';
import {FriendService} from '../../../../services/friend.service';
import {AppConfig} from '../../../../app-config';
import {UserService} from '../../../../services/user.service';
import {FriendRequest} from '../../../../shared/models/user';

@Component({
  selector: 'app-user-friends',
  templateUrl: './user-friends.component.html',
  styleUrls: ['./user-friends.component.css']
})
export class UserFriendsComponent implements OnInit {
  public receivedFriendRequests: FriendRequest[];
  public API_PATH: string = AppConfig.API_PATH;

  constructor(public authService: AuthService, public friendService: FriendService,
              public userService: UserService) {
  }

  ngOnInit() {
  }

  update() {
    this.friendService.getReceivedRequests().subscribe((requests) => this.receivedFriendRequests = requests.items);
    this.authService.updateUserInfo();
  }

}
