import {Component, OnInit} from '@angular/core';
import {CalendarEvent, CalendarView} from 'angular-calendar';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {

  public CalendarView = CalendarView;
  public view = CalendarView.Month;
  public viewDate = new Date();
  public meetings: CalendarEvent[];


  constructor() {
  }

  ngOnInit() {
  }

  update() {

  }


}
