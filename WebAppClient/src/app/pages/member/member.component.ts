import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {MatSnackBar} from '@angular/material';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {MediaMatcher} from '@angular/cdk/layout';
import {UserService} from '../../services/user.service';

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
  showNav = false;
  mobileQuery: MediaQueryList;
  loading = true;
  toggleFriendsList = false;
  userLinks = [
    {title: 'Profile', icon: 'account_box', link: '/member/user/info'},
    {title: 'Friends', icon: 'people', link: '/member/user/friends'}
  ];
  links = [
    {title: 'Meetings', icon: 'assignment', link: '/member/meeting'},
    {title: 'Meeting Invitations', icon: 'mail_outline', link: '/member/meeting-invitations'},
    {title: 'Meeting Calendar', icon: 'calendar_today', link: '/member/calendar'}
  ];

  constructor(public auth: AuthService, private snackBar: MatSnackBar,
              public userService: UserService,
              private  changeDetectorRef: ChangeDetectorRef, private mediaMatcher: MediaMatcher) {
    this.mobileQuery = mediaMatcher.matchMedia('(max-width: 767px)');
    this.mobileQuery.addListener(() => changeDetectorRef.detectChanges());
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
