import {Component, Input, OnInit} from '@angular/core';
import {CalendarEvent} from 'calendar-utils';

@Component({
  selector: 'app-week-freetime',
  templateUrl: './week-freetime.component.html',
  styleUrls: ['./week-freetime.component.css']
})
export class WeekFreetimeComponent implements OnInit {
  @Input() dayStartHour: number;
  @Input() dayEndHour: number;
  Math: any;
  viewDate = new Date();
  events: CalendarEvent[] = [];

  constructor() {
    this.Math = Math;
  }

  ngOnInit() {
    this.appenedNotFreeEvent();
  }

  appenedNotFreeEvent() {
    this.events.push({
      start: new Date('2018-11-12 12:00'),
      end: new Date('2018-11-12 13:30'),
      title: 'Tommy.Chan and kwwok11 may not free at this period',
      color: {primary: '#ffbab1', secondary: '#ff6d6f'},
      cssClass: 'not-free-time'
    });
    this.events.push({
      start: new Date('2018-11-13 11:00'),
      end: new Date('2018-11-13 15:30'),
      title: 'You may not free at this period',
      color: {primary: '#ffbab1', secondary: '#ff6d6f'},
      cssClass: 'not-free-time'
    });
    this.events.push({
      start: new Date('2018-11-14 13:00'),
      end: new Date('2018-11-14 13:30'),
      title: 'You may not free at this period',
      color: {primary: '#ffbab1', secondary: '#ff6d6f'},
      cssClass: 'not-free-time'
    });
    this.events.push({
      start: new Date('2018-11-14 14:00'),
      end: new Date('2018-11-14 17:30'),
      title: 'You may not free at this period',
      color: {primary: '#ffbab1', secondary: '#ff6d6f'},
      cssClass: 'not-free-time'
    });
    this.events.push({
      start: new Date('2018-11-15 10:00'),
      end: new Date('2018-11-15 14:30'),
      title: 'You may not free at this period',
      color: {primary: '#ffbab1', secondary: '#ff6d6f'},
      cssClass: 'not-free-time'
    });
  }

}
