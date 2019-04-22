import {Component, OnInit, ViewChild} from '@angular/core';
import {CalendarSettingComponent} from './calendar-setting/calendar-setting.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {

  @ViewChild(CalendarSettingComponent)
  calendarSetting: CalendarSettingComponent;

  constructor() {
  }

  ngOnInit() {
  }

  googleConnectStatusUpdate() {
    this.calendarSetting.update();
  }

}
