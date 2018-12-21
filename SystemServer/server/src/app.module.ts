import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { UserModule } from './core/user/user.module';
import { MeetingModule } from './core/meeting/meeting.module';
import { DeviceModule } from './core/device/device.module';
import { AuthModule } from './core/auth/auth.module';

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
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
