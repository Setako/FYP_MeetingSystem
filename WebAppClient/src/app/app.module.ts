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
import {MeetingListFabComponent} from './shared/components/floating-action-buttons/meeting-list-fab/meeting-list-fab.component';
import {QueryingContentHiderComponent} from './shared/components/querying-content-hider/querying-content-hider.component';
import {FriendListFabComponent} from './shared/components/floating-action-buttons/friend-list-fab/friend-list-fab.component';
import {AddFriendDialogComponent} from './shared/components/dialogs/add-friend-dialog/add-friend-dialog.component';
import {NotificationsComponent} from './shared/components/notifications/notifications.component';
import {ChatingBoxComponent} from './shared/components/chating-box/chating-box.component';
import {NotificationsSettingComponent} from './pages/member/settings/notifications-setting/notifications-setting.component';
import {GoogleServiceSettingComponent} from './pages/member/settings/google-service-setting/google-service-setting.component';
import {CalendarSettingComponent} from './pages/member/settings/calendar-setting/calendar-setting.component';
import {PrivacySettingComponent} from './pages/member/settings/privacy-setting/privacy-setting.component';
import {UserAvatarUploadDialogComponent} from './shared/components/dialogs/user-avatar-upload-dialog/user-avatar-upload-dialog.component';
import {TimeAgoPipe} from 'time-ago-pipe';
import {DatePipe} from '@angular/common';
import {ToDatePipe} from './shared/pipe/to-date.pipe';
import {MeetingInvitationsComponent} from './pages/member/meeting-invitations/meeting-invitations.component';
import {SelectFriendsDialogComponent} from './shared/components/dialogs/select-friends-dialog/select-friends-dialog.component';
import { ConfirmationDialogComponent } from './shared/components/dialogs/confirmation-dialog/confirmation-dialog.component';
import { FaceRecognitionSettingComponent } from './pages/member/settings/face-recognition-setting/face-recognition-setting.component';

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
    NotificationsComponent,
    ChatingBoxComponent,
    NotificationsSettingComponent,
    GoogleServiceSettingComponent,
    CalendarSettingComponent,
    PrivacySettingComponent,
    UserAvatarUploadDialogComponent,
    TimeAgoPipe,
    ToDatePipe,
    MeetingInvitationsComponent,
    SelectFriendsDialogComponent,
    ConfirmationDialogComponent,
    FaceRecognitionSettingComponent
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
    DatePipe,
    TimeAgoPipe,
    ToDatePipe
  ],
  entryComponents: [
    MeetingOperationsBottomSheetsComponent,
    AddFriendDialogComponent,
    UserAvatarUploadDialogComponent,
    SelectFriendsDialogComponent,
    ConfirmationDialogComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
