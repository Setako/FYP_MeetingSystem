import {Component, Input, OnInit} from '@angular/core';
import {MeetingInvitation} from '../../../../../shared/models/meeting';

@Component({
  selector: 'app-invitation-chip',
  templateUrl: './invitation-chip.component.html',
  styleUrls: ['./invitation-chip.component.css']
})
export class InvitationChipComponent implements OnInit {
  @Input() invitation: MeetingInvitation;

  constructor() {
  }

  ngOnInit() {
  }

}
