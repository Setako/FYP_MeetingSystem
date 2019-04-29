import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {AuthService} from '../../../../services/auth.service';
import {MatSnackBar} from '@angular/material';
import {UserService} from '../../../../services/user.service';
import {flatMap, tap} from 'rxjs/operators';
import {User} from '../../../../shared/models/user';

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
        {display: 'Friend request', name: 'friendRequest'},
      ]
    },
    {
      display: 'Meeting',
      types: [
        {display: 'Meeting invited by other', name: 'meetingInvitation'},
        {display: 'Meeting updated', name: 'meetingInfoUpdate'},
        {display: 'Meeting cancelled', name: 'meetingCancelled'},
        {display: 'Meeting reminder', name: 'meetingReminder'},
      ]
    }
  ];

  public notificationSettingForm = new FormGroup({
    friendRequestEmail: new FormControl(false),
    friendRequestNotification: new FormControl(false),
    meetingInfoUpdateEmail: new FormControl(false),
    meetingInfoUpdateNotification: new FormControl(false),
    meetingInvitationEmail: new FormControl(false),
    meetingInvitationNotification: new FormControl(false),
    meetingCancelledEmail: new FormControl(false),
    meetingCancelledNotification: new FormControl(false),
    meetingReminderEmail: new FormControl(false),
    meetingReminderNotification: new FormControl(false),
  });

  public updating = true;

  constructor(private authService: AuthService, private userService: UserService, private snackBar: MatSnackBar) {
  }

  ngOnInit() {
    this.notificationTypes.map(type => type.types).forEach(types => types.forEach(type => {
      this.notificationSettingForm.addControl(type.name + 'Email', new FormControl(false));
      this.notificationSettingForm.addControl(type.name + 'Notification', new FormControl(false));
    }));
    this.updateUserSetting().subscribe();
  }

  updateUserSetting() {
    this.updating = true;
    return this.authService.updateUserInfo().pipe(tap(() => {
      const user = this.authService.loggedInUser;


      const patchingValues = {};
      this.notificationTypes.map(type => type.types).forEach(types => types.forEach(type => {
        patchingValues[type.name + 'Email'] = user.setting.notification[type.name].email;
        patchingValues[type.name + 'Notification'] = user.setting.notification[type.name].notification;
      }));

      this.notificationSettingForm.patchValue(patchingValues);
      this.updating = false;
    }, () => {
      this.updating = false;
    }));
  }

  saveSetting() {
    this.updating = true;

    const notificationSetting: { [id: string]: { email: boolean, notification: boolean } } = {};
    this.notificationTypes.map(type => type.types).forEach(types => types.forEach(type => {
      notificationSetting[type.name] = {
        email: this.notificationSettingForm.value[type.name + 'Email'],
        notification: this.notificationSettingForm.value[type.name + 'Notification'],
      };
    }));

    const user: User = {
      username: this.authService.loggedInUser.username,
      setting: {
        notification: notificationSetting
      }
    };

    this.userService.editUser(user).pipe(flatMap(() => this.updateUserSetting())).subscribe(() => {
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
