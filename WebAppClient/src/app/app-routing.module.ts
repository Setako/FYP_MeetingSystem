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
import {AuthGuard} from './shared/route-guards/auth.guard';
import {SettingsComponent} from './pages/member/settings/settings.component';
import {CalendarComponent} from './pages/member/calendar/calendar.component';
import {MeetingCreateComponent} from './pages/member/meeting/meeting-create/meeting-create.component';
import {MeetingEditComponent} from './pages/member/meeting/meeting-edit/meeting-edit.component';
import {MeetingInvitationsComponent} from './pages/member/meeting-invitations/meeting-invitations.component';

const routes: Routes = [
  {
    path: 'member', component: MemberComponent, canActivate: [AuthGuard],
    children: [
      {path: '', redirectTo: 'dashboard', pathMatch: 'full'},
      {path: 'dashboard', component: DashboardComponent},
      {path: 'calendar', component: CalendarComponent, pathMatch: 'full'},
      {path: 'settings', component: SettingsComponent, pathMatch: 'full'},
      {path: 'meeting-invitations', component: MeetingInvitationsComponent, pathMatch: 'full'},
      {path: 'meeting', component: MeetingListComponent, pathMatch: 'full'},
      {path: 'meeting/create', component: MeetingCreateComponent, pathMatch: 'full'},
      {path: 'meeting/:id', component: MeetingDetailComponent, pathMatch: 'full'},
      {path: 'meeting/:id/edit', component: MeetingEditComponent, pathMatch: 'full'},
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
