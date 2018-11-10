import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {LoginComponent} from './pages/login/login.component';
import {MemberComponent} from './pages/member/member.component';
import {DashboardComponent} from './pages/member/dashboard/dashboard.component';
import {MeetingListComponent} from './pages/member/meeting/meeting-list/meeting-list.component';
import {MeetingDetailComponent} from './pages/member/meeting/meeting-detail/meeting-detail.component';
import {UserComponent} from './pages/member/user/user.component';
import {UserInfoComponent} from './pages/member/user/user-info/user-info.component';
import {UserFriendsComponent} from './pages/member/user/user-friends/user-friends.component';

const routes: Routes = [
  {
    path: 'member', component: MemberComponent,
    children: [
      {path: '', redirectTo: 'dashboard', pathMatch: 'full'},
      {path: 'dashboard', component: DashboardComponent},
      {path: 'meeting', component: MeetingListComponent, pathMatch: 'full'},
      {path: 'meeting/:id', component: MeetingDetailComponent, pathMatch: 'full'},
      {
        path: 'user', component: UserComponent,
        children: [
          {path: 'info', component: UserInfoComponent},
          {path: 'friends', component: UserFriendsComponent},
        ]
      }
    ]
  },
  {path: 'login', component: LoginComponent},
  {path: '', redirectTo: 'login', pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {

}
