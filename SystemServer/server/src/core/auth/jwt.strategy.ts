import { TokenExpiredException } from '@commander/shared/exception/auth/token-expired.exception';
import { TokenOwnerNotExistException } from '@commander/shared/exception/auth/token-owner-not-exist.exception';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { JwtPayload } from './dto/jwt-payload.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.TOKEN_SECRET || 'tokenSecret',
        });
    }

    async validate(payload: JwtPayload) {
        const user = await this.authService.validateUser(payload).toPromise();
        if (!user) {
            throw new TokenOwnerNotExistException();
        }
        if (user.tokenVerificationCode !== payload.tokenVerificationCode) {
            throw new TokenExpiredException();
        }

        return user;
    }
}
