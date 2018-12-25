import { Module, CacheModule } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { UserModule } from './core/user/user.module';
import { MeetingModule } from './core/meeting/meeting.module';
import { DeviceModule } from './core/device/device.module';
import { AuthModule } from './core/auth/auth.module';
import { FriendRequestModule } from './core/friend-request/friend-request.module';
import { NotificationModule } from './core/notification/notification.module';
import { FriendModule } from './core/friend/friend.module';

@Module({
    imports: [
        TypegooseModule.forRoot(process.env.dbUrl, {
            useNewUrlParser: true,
            useCreateIndex: true,
        }),
        // CacheModule.register(),
        AuthModule,
        UserModule,
        MeetingModule,
        DeviceModule,
        FriendRequestModule,
        NotificationModule,
        FriendModule,
    ],
    controllers: [],
    providers: [
        // {
        //     provide: APP_INTERCEPTOR,
        //     useClass: CacheInterceptor,
        // },
    ],
})
export class AppModule {}
