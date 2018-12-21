import { Module, CacheModule, CacheInterceptor } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { UserModule } from './core/user/user.module';
import { MeetingModule } from './core/meeting/meeting.module';
import { DeviceModule } from './core/device/device.module';
import { AuthModule } from './core/auth/auth.module';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
    imports: [
        TypegooseModule.forRoot(process.env.dbUrl, {
            useNewUrlParser: true,
            useCreateIndex: true,
        }),
        CacheModule.register(),
        AuthModule,
        UserModule,
        MeetingModule,
        DeviceModule,
    ],
    controllers: [],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useClass: CacheInterceptor,
        },
    ],
})
export class AppModule {}
