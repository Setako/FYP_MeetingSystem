import {Component, OnInit} from '@angular/core';
import {FormControl} from '@angular/forms';

@Component({
  selector: 'app-meeting-edit',
  templateUrl: './meeting-edit.component.html',
  styleUrls: ['./meeting-edit.component.css']
})
export class MeetingEditComponent implements OnInit {
  today: Date = new Date();

  get timeAutoComplete() {
    return Array.from(new Array(48), (x, i) => i)
      .map((x) => ({hour: Math.floor(x / 2), minute: (x % 2) * 30}))
      .map((t) => `${(t.hour + '').padStart(2, '0')}:${(t.minute + '').padStart(2, '0')}`);
  }

  constructor() {
  }

  ngOnInit() {
  }

}
