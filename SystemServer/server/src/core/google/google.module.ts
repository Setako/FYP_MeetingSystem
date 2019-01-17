import { GoogleAuthService } from './google-auth.service';
import { Module } from '@nestjs/common';
import { GoogleController } from './google.controller';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';

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
    providers: [GoogleAuthService, UserService],
})
export class GoogleModule {}
