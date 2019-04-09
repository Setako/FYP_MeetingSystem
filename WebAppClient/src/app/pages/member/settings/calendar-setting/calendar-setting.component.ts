import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-calendar-setting',
  templateUrl: './calendar-setting.component.html',
  styleUrls: ['./calendar-setting.component.scss']
})
export class CalendarSettingComponent implements OnInit {
  private possibleCalendars: GoogleCalendar[] = [];

  constructor(private http: HttpClient) {
  }

  ngOnInit(): void {
  }

  update() {

  }

  saveSetting(): void {

  }

}

interface GoogleCalendar {

}
