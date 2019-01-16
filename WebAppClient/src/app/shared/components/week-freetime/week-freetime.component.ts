import {Component, Input, OnInit} from '@angular/core';
import {CalendarEvent, CalendarView} from 'angular-calendar';

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
  public CalendarView = CalendarView;
  public view = CalendarView.Month;

  constructor() {
    this.Math = Math;
  }

  ngOnInit() {
    this.appenedNotFreeEvent();
  }

  appenedNotFreeEvent() {
    this.events.push({
      start: new Date('2019-01-13 13:00'),
      end: new Date('2019-01-13 13:30'),
      title: 'Tommy.Chan and kwwok11 may not free at this period',
      color: {primary: '#ffbab1', secondary: '#ff6d6f'},
      cssClass: 'not-free-time'
    });
    this.events.push({
      start: new Date('2019-01-14 10:00'),
      end: new Date('2019-01-14 10:30'),
      title: 'Tommy.Chan and kwwok11 may not free at this period',
      color: {primary: '#ffbab1', secondary: '#ff6d6f'},
      cssClass: 'not-free-time'
    });
    this.events.push({
      start: new Date('2019-01-14 13:00'),
      end: new Date('2019-01-14 14:00'),
      title: 'Tommy.Chan and kwwok11 may not free at this period',
      color: {primary: '#ffbab1', secondary: '#ff6d6f'},
      cssClass: 'not-free-time'
    });
    this.events.push({
      start: new Date('2019-01-15 14:00'),
      end: new Date('2019-01-15 17:30'),
      title: 'Tommy.Chan and kwwok11 may not free at this period',
      color: {primary: '#ffbab1', secondary: '#ff6d6f'},
      cssClass: 'not-free-time'
    });
    this.events.push({
      start: new Date('2019-01-16 12:00'),
      end: new Date('2019-01-16 13:30'),
      title: 'Tommy.Chan and kwwok11 may not free at this period',
      color: {primary: '#ffbab1', secondary: '#ff6d6f'},
      cssClass: 'not-free-time'
    });
    this.events.push({
      start: new Date('2019-01-17 11:00'),
      end: new Date('2019-01-17 15:30'),
      title: 'You may not free at this period',
      color: {primary: '#ffbab1', secondary: '#ff6d6f'},
      cssClass: 'not-free-time'
    });
    this.events.push({
      start: new Date('2019-01-17 09:00'),
      end: new Date('2019-01-17 10:30'),
      title: 'You may not free at this period',
      color: {primary: '#ffbab1', secondary: '#ff6d6f'},
      cssClass: 'not-free-time'
    });
    this.events.push({
      start: new Date('2019-01-18 14:00'),
      end: new Date('2019-01-18 17:30'),
      title: 'You may not free at this period',
      color: {primary: '#ffbab1', secondary: '#ff6d6f'},
      cssClass: 'not-free-time'
    });
    this.events.push({
      start: new Date('2019-01-18 10:00'),
      end: new Date('2019-01-18 12:30'),
      title: 'You may not free at this period',
      color: {primary: '#ffbab1', secondary: '#ff6d6f'},
      cssClass: 'not-free-time'
    });
    this.events.push({
      start: new Date('2019-01-19 09:00'),
      end: new Date('2019-01-19 13:30'),
      title: 'You may not free at this period',
      color: {primary: '#ffbab1', secondary: '#ff6d6f'},
      cssClass: 'not-free-time'
    });
  }

}
