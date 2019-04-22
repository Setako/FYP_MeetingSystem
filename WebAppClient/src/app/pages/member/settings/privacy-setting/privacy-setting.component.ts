import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../../../services/auth.service';
import {User} from '../../../../shared/models/user';
import {UserService} from '../../../../services/user.service';

@Component({
  selector: 'app-privacy-setting',
  templateUrl: './privacy-setting.component.html',
  styleUrls: ['./privacy-setting.component.scss']
})
export class PrivacySettingComponent implements OnInit {
  private allowFriendRequest: boolean;
  private querying = false;

  constructor(private authService: AuthService, private  userService: UserService) {
  }

  ngOnInit() {
    this.allowFriendRequest = this.authService.loggedInUser.setting.privacy.allowOtherToSendFirendRequest;
  }

  save() {
    const user: User = {
      username: this.authService.loggedInUser.username,
      setting: {
        privacy: {
          allowOtherToSendFirendRequest: this.allowFriendRequest
        }
      }
    };

    this.querying = true;
    this.userService.editUser(user).subscribe(() => {
      this.querying = false;
    });

  }
}

