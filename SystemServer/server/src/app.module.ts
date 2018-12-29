import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { AuthModule } from './core/auth/auth.module';
import { DeviceModule } from './core/device/device.module';
import { FriendRequestModule } from './core/friend-request/friend-request.module';
import { FriendModule } from './core/friend/friend.module';
import { MeetingModule } from './core/meeting/meeting.module';
import { NotificationModule } from './core/notification/notification.module';
import { UserModule } from './core/user/user.module';

@Module({
    imports: [
        TypegooseModule.forRoot(process.env.dbUrl, {
            useNewUrlParser: true,
            useCreateIndex: true,
        }),
        AuthModule,
        UserModule,
        MeetingModule,
        DeviceModule,
        FriendRequestModule,
        NotificationModule,
        FriendModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
