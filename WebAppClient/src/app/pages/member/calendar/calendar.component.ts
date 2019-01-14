import {Component, OnInit} from '@angular/core';
import {CalendarEvent, CalendarView} from 'angular-calendar';
import {Millisecond} from '../../../utils/time-unit';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {

  public CalendarView = CalendarView;
  public view = CalendarView.Month;
  public viewDate = new Date();
  public meetings: CalendarEvent[] = [];


  constructor() {
    this.update();
  }

  ngOnInit() {
  }

  update() {
    this.meetings.push({
      id: 5,
      title: 'Incident discussion',
      start: new Date(new Date().getMilliseconds() + Millisecond.Day * 2),
      end: new Date(new Date().getMilliseconds() + Millisecond.Day * 2 + Millisecond.Hour * 2),
      color: {
        primary: '#ff2500',
        secondary: '#b100ff'
      }
    });
  }


}
