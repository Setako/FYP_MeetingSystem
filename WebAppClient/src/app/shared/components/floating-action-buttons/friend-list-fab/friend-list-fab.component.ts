import {Component, Input, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material';
import {AddFriendDialogComponent} from '../../dialogs/add-friend-dialog/add-friend-dialog.component';

@Component({
  selector: 'app-friend-list-fab',
  templateUrl: './friend-list-fab.component.html',
  styleUrls: ['./friend-list-fab.component.css']
})
export class FriendListFabComponent implements OnInit {
  @Input('refreshCallback') refreshCallback: () => any;

  constructor(private dialog: MatDialog) {
  }

  ngOnInit() {
  }

  openFriendRequestDialog() {
    this.dialog.open(AddFriendDialogComponent).afterClosed().subscribe((added) => {
      if (added) {
        this.refreshCallback();
      }
    });
  }

}
