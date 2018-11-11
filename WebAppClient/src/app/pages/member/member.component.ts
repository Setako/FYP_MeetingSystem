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
