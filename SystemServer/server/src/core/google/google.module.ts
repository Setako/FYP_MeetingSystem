import { GoogleAuthService } from './google-auth.service';
import { Module, forwardRef } from '@nestjs/common';
import { GoogleController } from './google.controller';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';
import { GoogleEventService } from './google-event.service';
import { GoogleCalendarService } from './google-calendar.service';
import { GoogleCloudStorageService } from './google-cloud-storage.service';
import { GoogleDriveService } from './google-drive.service';

@Module({
    imports: [
        JwtModule.register({
            secretOrPrivateKey: process.env.TOKEN_SECRET || 'tokenSecret',
            signOptions: {
                expiresIn: '15m',
            },
        }),
        forwardRef(() => UserModule),
    ],
    controllers: [GoogleController],
    providers: [
        GoogleAuthService,
        GoogleEventService,
        GoogleDriveService,
        GoogleCalendarService,
        GoogleCloudStorageService,
    ],
    exports: [
        GoogleAuthService,
        GoogleEventService,
        GoogleDriveService,
        GoogleCalendarService,
        GoogleCloudStorageService,
    ],
})
export class GoogleModule {}
