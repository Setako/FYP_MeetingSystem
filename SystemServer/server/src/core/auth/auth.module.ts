import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
            secretOrPrivateKey: process.env.TOKEN_SECRET || 'tokenSecret',
            signOptions: {
                expiresIn: '7d',
            },
        }),
        UserModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [],
})
export class AuthModule {}
