import {Component, Input, OnInit} from '@angular/core';
import {MeetingStatus} from '../../models/meeting';

@Component({
  selector: 'app-meeting-status',
  templateUrl: './meeting-status.component.html',
  styleUrls: ['./meeting-status.component.css']
})
export class MeetingStatusComponent implements OnInit {
  @Input()
  public status: MeetingStatus;

  // public colorMapping = {
  //   draft: '#c2c2c2',
  //   planned: '',
  //   confirmed: '',
  //   cancelled: '',
  //   started: '',
  //   ended: '',
  //   deleted: ''
  // };

  constructor() {
  }

  ngOnInit() {
  }

}
