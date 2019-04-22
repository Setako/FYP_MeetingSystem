import {Component, Input, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material';
import {Meeting} from '../../models/meeting';
import {SharedFilesDialogComponent} from '../dialogs/shared-files-dialog/shared-files-dialog.component';

@Component({
  selector: 'app-shared-files-button',
  templateUrl: './shared-files-button.component.html',
  styleUrls: ['./shared-files-button.component.css']
})
export class SharedFilesButtonComponent implements OnInit {
  @Input()
  meeting: Meeting;

  constructor(private dialog: MatDialog) {
  }

  ngOnInit() {
  }

  showListFilesDialog() {
    this.dialog.open(SharedFilesDialogComponent, {
      data: {sharedFileIds: this.meeting.resources.main.googleDriveResources.map(res => res.resId)}
    }).afterClosed().subscribe();
  }

  openAgenda() {
    window.open(`https://drive.google.com/open?id=${this.meeting.agendaGoogleResourceId}`, '_blank');
  }
}
