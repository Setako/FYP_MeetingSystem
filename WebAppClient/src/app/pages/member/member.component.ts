import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {MatSnackBar} from '@angular/material';
import {animate, state, style, transition, trigger} from '@angular/animations';

@Component({
  selector: 'app-member',
  templateUrl: './member.component.html',
  styleUrls: ['./member.component.css'],
  animations: [
    trigger('slide', [
      transition(':enter', [
        style({transform: 'translateX(100%)'}),
        animate('100ms ease', style({transform: 'translateX(0%)'}))
      ]),
      transition(':leave', [
        animate('100ms ease', style({transform: 'translateX(100%)'}))
      ])
    ])
  ]
})

export class MemberComponent implements OnInit {
  loading = true;
  toggleFriendsList = false;
  userLinks = [
    {title: 'Profile', icon: 'account_box', link: '/member/user/info'},
    {title: 'Friends', icon: 'people', link: '/member/user/friends'}
  ];
  links = [
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
