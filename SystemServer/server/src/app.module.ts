import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { MailerModule } from '@nest-modules/mailer';
import { AuthModule } from './core/auth/auth.module';
import { DeviceModule } from './core/device/device.module';
import { FriendRequestModule } from './core/friend-request/friend-request.module';
import { FriendModule } from './core/friend/friend.module';
import { MeetingModule } from './core/meeting/meeting.module';
import { NotificationModule } from './core/notification/notification.module';
import { UserModule } from './core/user/user.module';
import { GoogleModule } from './core/google/google.module';
import { WebsocketModule } from './core/websocket/websocket.module';
import { SearchModule } from './core/search/search.module';
import { BreakChangeModule } from './core/break-change/break-change.module';

@Module({
    imports: [
        TypegooseModule.forRoot(process.env.DB_URL, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
        }),
        MailerModule.forRoot({
            transport: JSON.parse(process.env.MAIL_TRANSPORT),
        }),
        MailerModule,
        AuthModule,
        UserModule,
        MeetingModule,
        DeviceModule,
        NotificationModule,
        FriendModule,
        FriendRequestModule,
        GoogleModule,
        SearchModule,
        WebsocketModule,
        BreakChangeModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
