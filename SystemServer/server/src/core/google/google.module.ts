import { GoogleAuthService } from './google-auth.service';
import { Module } from '@nestjs/common';
import { GoogleController } from './google.controller';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';
import { GoogleEventService } from './google-event.service';
import { GoogleCalendarService } from './google-calendar.service';

@Module({
    imports: [
        JwtModule.register({
            secretOrPrivateKey: process.env.TOKEN_SECRET || 'tokenSecret',
            signOptions: {
                expiresIn: '15m',
            },
        }),
        UserModule,
    ],
    controllers: [GoogleController],
    providers: [GoogleAuthService, GoogleEventService, GoogleCalendarService],
    exports: [GoogleAuthService, GoogleEventService, GoogleCalendarService],
})
export class GoogleModule {}
