import {Component, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';

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

  constructor(private formBuilder: FormBuilder) {
    this.notificationSettingForm = this.formBuilder.group({});
  }

  ngOnInit() {
  }

  save() {

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
