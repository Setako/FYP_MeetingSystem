import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {AuthService} from '../../../../services/auth.service';
import {MatSnackBar} from '@angular/material';
import {UserService} from '../../../../services/user.service';

@Component({
  selector: 'app-notifications-setting',
  templateUrl: './notifications-setting.component.html',
  styleUrls: ['./notifications-setting.component.scss']
})
export class NotificationsSettingComponent implements OnInit {

  public notificationTypes: NotificationTypeGroup[] = [
    {
      display: 'Friend',
      types: [
        {display: 'Friend request received', name: 'friendRequestReceived'},
        {display: 'Friend request accepted by other', name: 'friendRequestAccepted'},
        {display: 'Friend request rejected by other', name: 'friendRequestRejected'},
      ]
    },
    {
      display: 'Meeting',
      types: [
        {display: 'Meeting invited by other', name: 'meetingInvited'},
        {display: 'Meeting updated', name: 'meetingUpdated'},
        {display: 'Meeting cancelled', name: 'meetingCancelled'},
        {display: 'Meeting reminder', name: 'meetingReminder'},
      ]
    }
  ];

  public notificationSettingForm: FormGroup;

  public notificationSettingForm = new FormGroup({
    friendRequest: new FormControl(false),
    meetingInfoUpdate: new FormControl(false),
    meetingInvitation: new FormControl(false),
    meetingCancelled: new FormControl(false),
    meetingReminder: new FormControl(false),
  });

  public updating = true;

  constructor(private authService: AuthService, private userService: UserService, private snackBar: MatSnackBar) {
  }

  ngOnInit() {
    this.updateUserSetting().subscribe();
  }

  updateUserSetting() {
    this.updating = true;
    return this.authService.updateUserInfo().pipe(tap(() => {
      const user = this.authService.loggedInUser;

      this.notificationSettingForm.patchValue({
        friendRequest: user.setting.notification.friendRequest,
        meetingInfoUpdate: user.setting.notification.meetingInfoUpdate,
        meetingInvitation: user.setting.notification.meetingInvitation,
        meetingCancelled: user.setting.notification.meetingCancelled,
        meetingReminder: user.setting.notification.meetingReminder,
      });
      this.updating = false;
    }, () => {
      this.updating = false;
    }));
  }

  saveSetting() {
    this.updating = true;
    const user: User = {
      username: this.authService.loggedInUser.username,
      setting: {
        notification: {
          friendRequest: this.notificationSettingForm.value.friendRequest,
          meetingInfoUpdate: this.notificationSettingForm.value.meetingInfoUpdate,
          meetingInvitation: this.notificationSettingForm.value.meetingInvitation,
          meetingCancelled: this.notificationSettingForm.value.meetingCancelled,
          meetingReminder: this.notificationSettingForm.value.meetingReminder,
        }
      }
    };

    this.userService.editUser(user).pipe(this.updateUserSetting).subscribe(() => {
      this.snackBar.open('Update success', 'DISMISS', {duration: 4000});
    });

  }

}

interface NotificationTypeGroup {
  display: string;
  types: NotificationType[];
}

interface NotificationType {
  display: string;
  name: string;
}
