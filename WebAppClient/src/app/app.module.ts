import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';
import {LoginComponent} from './pages/login/login.component';
import {DashboardComponent} from './pages/member/dashboard/dashboard.component';
import {MeetingListComponent} from './pages/member/meeting/meeting-list/meeting-list.component';
import {MemberComponent} from './pages/member/member.component';
import {UserInfoComponent} from './pages/member/user/user-info/user-info.component';
import {UserFriendsComponent} from './pages/member/user/user-friends/user-friends.component';
import {MeetingDetailComponent} from './pages/member/meeting/meeting-detail/meeting-detail.component';
import {UserComponent} from './pages/member/user/user.component';
import {MaterialsModule} from './materials.module';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {HttpCommonErrorHandlerService} from './services/http-common-error-handler.service';
import {HttpTokenInjectorService} from './services/http-token-injector.service';
import {AuthGuard} from './shared/route-guards/auth.guard';
import {SettingsComponent} from './pages/member/settings/settings.component';
import {CalendarComponent} from './pages/member/calendar/calendar.component';
import {MeetingCreateComponent} from './pages/member/meeting/meeting-create/meeting-create.component';
import {MeetingEditComponent} from './pages/member/meeting/meeting-edit/meeting-edit.component';
import {CalendarModule, DateAdapter} from 'angular-calendar';
import {adapterFactory} from 'angular-calendar/date-adapters/date-fns';
import {WeekFreetimeComponent} from './shared/components/week-freetime/week-freetime.component';
import {FriendsSidebarComponent} from './shared/components/friends-sidebar/friends-sidebar.component';
import {
  MeetingOperationsBottomSheetsComponent
} from './shared/components/bottom-sheets/meeting-operations/meeting-operations-bottom-sheets.component';
import { MeetingListFabComponent } from './shared/components/floating-action-buttons/meeting-list-fab/meeting-list-fab.component';
import { QueryingContentHiderComponent } from './shared/components/querying-content-hider/querying-content-hider.component';
import { FriendListFabComponent } from './shared/components/floating-action-buttons/friend-list-fab/friend-list-fab.component';
import { AddFriendDialogComponent } from './shared/components/dialogs/add-friend-dialog/add-friend-dialog.component';
import { NotificationsComponent } from './shared/components/notifications/notifications.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    MeetingListComponent,
    MemberComponent,
    UserInfoComponent,
    UserFriendsComponent,
    MeetingDetailComponent,
    UserComponent,
    SettingsComponent,
    CalendarComponent,
    MeetingCreateComponent,
    MeetingEditComponent,
    WeekFreetimeComponent,
    FriendsSidebarComponent,
    MeetingOperationsBottomSheetsComponent,
    MeetingListFabComponent,
    QueryingContentHiderComponent,
    FriendListFabComponent,
    AddFriendDialogComponent,
    NotificationsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialsModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory
    })
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpCommonErrorHandlerService,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpTokenInjectorService,
      multi: true
    },
  ],
  entryComponents: [
    MeetingOperationsBottomSheetsComponent,
    AddFriendDialogComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
