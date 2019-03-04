import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {CalendarEvent, CalendarView, CalendarWeekViewComponent} from 'angular-calendar';
import {Meeting} from '../../models/meeting';
import {MeetingService} from '../../../services/meeting.service';
import * as moment from 'moment';
import {MatSnackBar} from '@angular/material';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-week-freetime',
  templateUrl: './week-freetime.component.html',
  styleUrls: ['./week-freetime.component.scss']
})
export class WeekFreetimeComponent implements OnInit {
  @Input() dayStartHour: number;
  @Input() dayEndHour: number;
  @ViewChild('calendar') calendar: CalendarWeekViewComponent;
  busyTimes: CalendarEvent[] = [];
  public view = CalendarView.Week;
  public queryingSubscription: Subscription = null;

  Math: any;
  viewDate = new Date();
  private selectedDate: Date;
  public CalendarView = CalendarView;

  constructor(public meetingService: MeetingService, public snackBar: MatSnackBar) {
    this.Math = Math;
  }

  private _meeting: Meeting;

  get meeting(): Meeting {
    return this._meeting;
  }

  @Input()
  set meeting(meeting: Meeting) {
    if (meeting != null) {
      this._meeting = meeting;
      this.selectedDate = this._meeting.plannedStartTime == null ? null : new Date(this._meeting.plannedStartTime);
      this.update();
    }
  }

  get events(): CalendarEvent[] {
    return this.selectedDate == null
      ? this.busyTimes
      : this.busyTimes.concat({
        start: this.selectedDate,
        end: moment(this.selectedDate).add(this.meeting.length, 'millisecond').toDate(),
        title: 'Planning time',
        color: {primary: '#ffecb3', secondary: '#ffc107'},
        cssClass: 'selected-time'
      });
  }

  ngOnInit() {
    this.update();
  }

  update() {
    if (this.meeting != null) {
      const start = moment(this.viewDate).startOf('week').hour(0).minute(0).second(0).toDate();
      const end = moment(this.viewDate).endOf('week').minute(59).second(59).toDate();

      if (this.queryingSubscription != null) {
        this.queryingSubscription.unsubscribe();
      }

      this.queryingSubscription = this.meetingService.getBusyTime(this.meeting, start, end).subscribe(busyTimes => {
        this.busyTimes = [];

        busyTimes.items.forEach(busyTime => {
          this.busyTimes.push({
            start: new Date(busyTime.fromDate),
            end: new Date(busyTime.toDate),
            title: busyTime.users.map(user => user.displayName).join(', ') + ' may not free at this period',
            color: {primary: '#ffbab1', secondary: '#ff6d6f'},
            cssClass: 'not-free-time'
          });
        });

        this.queryingSubscription = null;
      });
    }
  }

  setPlanningTime($event: { date: Date }) {
    if (moment($event.date).isAfter()) {
      this.selectedDate = $event.date;
      this.meeting.plannedStartTime = $event.date.toISOString();
    } else {
      this.snackBar.open('You can\'t select a passed time', 'Dismiss', {duration: 3000});
    }
  }
}
