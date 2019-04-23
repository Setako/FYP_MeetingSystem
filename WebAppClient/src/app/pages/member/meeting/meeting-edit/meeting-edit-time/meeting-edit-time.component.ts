import {Component, Input, OnInit} from '@angular/core';
import {Meeting} from '../../../../../shared/models/meeting';

@Component({
  selector: 'app-meeting-edit-time',
  templateUrl: './meeting-edit-time.component.html',
  styleUrls: ['./meeting-edit-time.component.css']
})
export class MeetingEditTimeComponent implements OnInit {

  @Input()
  public meeting: Meeting;

  today: Date = new Date();
  public timeSlotSuggestions: Date[] = [
    new Date('2019-01-15 10:00'),
    new Date('2019-01-16 14:30'),
    new Date('2019-01-17 16:30'),
  ];
  searchTimeStart = '00:00';
  searchTimeEnd = '24:00';

  constructor() {
  }

  get searchTimeStartFormated() {
    console.log(this.formatHour(this.searchTimeStart));
    return this.formatHour(this.searchTimeStart);
  }

  get searchTimeEndFormated() {
    return this.formatHour(this.searchTimeEnd);
  }

  get timeAutoComplete() {
    console.log(this.searchTimeStart);
    return Array.from(new Array(48), (x, i) => i)
      .map((x) => ({hour: Math.floor(x / 2), minute: (x % 2) * 30}))
      .map((t) => `${(t.hour + '').padStart(2, '0')}:${(t.minute + '').padStart(2, '0')}`);
  }

  private formatHour(str: string) {
    const hourStr = str.split(':')[0];
    const minStr = str.split(':')[1];
    const hour = Math.max(0, Math.min(24, parseInt(hourStr, 10) || 0));
    const min = parseInt(minStr, 10) || 0;
    return hour + (min === 0 ? 0 : 0.5);
  }

  ngOnInit() {
  }

}
