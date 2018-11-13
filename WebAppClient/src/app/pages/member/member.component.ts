import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {MatSnackBar} from '@angular/material';

@Component({
  selector: 'app-member',
  templateUrl: './member.component.html',
  styleUrls: ['./member.component.css']
})
export class MemberComponent implements OnInit {
  public loading = true;
  public userLinks = [
    {title: 'Profile', icon: 'account_box', link: '/member/user/info'},
    {title: 'Friends', icon: 'people', link: '/member/user/friends'}
  ];
  public links = [
    {title: 'Meetings', icon: 'assignment', link: '/member/meeting'},
    {title: 'Calendar', icon: 'calendar_today', link: '/member/calendar'},
    {title: 'Settings', icon: 'settings', link: '/member/settings'},
  ];

  constructor(public auth: AuthService, private snackBar: MatSnackBar) {
  }

  ngOnInit() {
    this.auth.updateUserInfo().subscribe(() => this.loading = false);
  }

  showNavBar(): boolean {
    return true;
  }

  logout() {
    this.auth.logout();
    this.snackBar.open('Logged out', 'Dismiss', {duration: 4000});
  }

}
