import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef, MatSelectionList, MatSnackBar} from '@angular/material';
import {FriendService} from '../../../../services/friend.service';
import {Friend} from '../../../models/user';

@Component({
  selector: 'app-select-friends-dialog',
  templateUrl: './select-friends-dialog.component.html',
  styleUrls: ['./select-friends-dialog.component.css']
})
export class SelectFriendsDialogComponent implements OnInit {

  public title: string;
  public friends: Friend[] = [];
  public displayFriends: Friend[] = [];
  public hiddenFriendsUsername: string[] = [];
  public querying = false;
  public keyWords = '';

  @ViewChild('friendSelect')
  public friendSelect: MatSelectionList;


  constructor(public dialogRef: MatDialogRef<SelectFriendsDialogComponent>, public friendService: FriendService,
              public snackBar: MatSnackBar, @Inject(MAT_DIALOG_DATA) data) {
    this.title = data.title;
    if (data.hiddenFriendsUsername != null) {
      this.hiddenFriendsUsername = data.hiddenFriendsUsername;
    }
  }

  ngOnInit() {
    this.updateFriends();
  }

  updateFriends() {
    this.querying = true;
    this.friendService.getFriends().subscribe(friends => {
      this.querying = false;
      this.friends = friends.items;
    }, err => this.querying = false);
  }

  get filteredFriends() {
    return this.friends
      .filter(friend => !this.hiddenFriendsUsername.includes(friend.user.username))
      .filter(friend =>
        this.keyWords === ''
        || friend.user.username.includes(this.keyWords)
        || friend.user.displayName.includes(this.keyWords))
      .sort((a, b) => (+b.stared - +a.stared));
  }

  confirm() {
    this.dialogRef.close(this.friendSelect.selectedOptions.selected.map(opt => opt.value));
  }
}
