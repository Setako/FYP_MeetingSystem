import {Component, OnInit} from '@angular/core';
import {MatSnackBar} from '@angular/material';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'MeetingDeviceUI';

  constructor(public snackBar: MatSnackBar) {
  }

  ngOnInit() {
    this.openSnackBar('Meeting Device UI Start success!');
  }

  openSnackBar(message: any) {
    this.snackBar.open(message, null, {duration: 5000});
  }
}
