import {Component, Input, OnInit} from '@angular/core';
import {Meeting} from '../../../../../shared/models/meeting';
import {MeetingService} from '../../../../../services/meeting.service';
import {SuggestTime} from '../../../../../shared/models/suggest-time';

@Component({
  selector: 'app-meeting-edit-time',
  templateUrl: './meeting-edit-time.component.html',
  styleUrls: ['./meeting-edit-time.component.css']
})
export class MeetingEditTimeComponent implements OnInit {

  public selectedDate: Date;
  @Input()
  public meeting: Meeting = null;
  today: Date = new Date();

  get searchTimeStartFormated() {
    return this.formatHour(this.searchTimeStart);
  }

  get searchTimeEndFormated() {
    return this.formatHour(this.searchTimeEnd);
  }

  get timeAutoComplete() {
    return Array.from(new Array(48), (x, i) => i)
      .map((x) => ({hour: Math.floor(x / 2), minute: (x % 2) * 30}))
      .map((t) => `${(t.hour + '').padStart(2, '0')}:${(t.minute + '').padStart(2, '0')}`);
  }

  public timeSlotSuggestions: SuggestTime[] = [];
  searchTimeStart = '00:00';
  searchTimeEnd = '24:00';
  fromDate: Date;
  toDate: Date;

  constructor(private meetingService: MeetingService) {
  }

  public get searchTimeEnabled(): boolean {
    return !!this.fromDate && !!this.toDate && this.checkHourFormat(this.searchTimeStart) && this.checkHourFormat(this.searchTimeEnd) && this.includeDays.length > 0;
  }

  public _includeDays: { [day: number]: boolean } = {
    0: false,
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false
  };

  public get includeDays(): number[] {
    const result = Object.entries(this._includeDays).filter(entry => entry[1]).map(entry => parseInt(entry[0], 10));
    return result.length > 0 ? result
      : Object.keys(this._includeDays).map(key => parseInt(key, 10));
  }

  isoToDate(iso: string): Date {
    return new Date(iso);
  }

  public search() {
    this.meetingService.getSuggestTime(this.meeting, this.fromDate, this.toDate, this.searchTimeStart, this.searchTimeEnd, this.includeDays)
      .subscribe((res) => {
        this.timeSlotSuggestions = res.items;
      });
  }

  private formatHour(str: string) {
    const hourStr = str.split(':')[0];
    const minStr = str.split(':')[1];
    const hour = Math.max(0, Math.min(24, parseInt(hourStr, 10) || 0));
    const min = parseInt(minStr, 10) || 0;
    return hour + (min === 0 ? 0 : 0.5);
  }

  private checkHourFormat(str: string) {
    const hourStr = str.split(':')[0];
    const minStr = str.split(':')[1];
    return !(isNaN(parseInt(hourStr, 10)) || isNaN(parseInt(minStr, 10)));
  }

  ngOnInit() {
  }

}
