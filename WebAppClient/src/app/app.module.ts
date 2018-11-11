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
    UserComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialsModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
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
  bootstrap: [AppComponent]
})
export class AppModule {
}
