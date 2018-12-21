import {Component, Inject, OnInit} from '@angular/core';
import {MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef} from '@angular/material';
import {Meeting} from '../../../models/meeting';
import {AuthService} from '../../../../services/auth.service';

@Component({
  selector: 'app-meeting-operations',
  templateUrl: './meeting-operations.component.html',
  styleUrls: ['./meeting-operations.component.css']
})
export class MeetingOperationsBottomSheetsComponent implements OnInit {

  constructor(private bottomSheetRef: MatBottomSheetRef<MeetingOperationsBottomSheetsComponent>,
              @Inject(MAT_BOTTOM_SHEET_DATA) public meeting: Meeting,
              public authService: AuthService) {
  }

  ngOnInit() {
  }



}
