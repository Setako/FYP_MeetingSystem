import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { JwtPayload } from './dto/jwt-payload.dto';
import { TokenOwnerNotExistException } from '../../exception/auth/token-owner-not-exist.exception';
import { TokenExpiredException } from '../../exception/auth/token-expired.exception';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.tokenSecret || 'tokenSecret',
        });
    }

    async validate(payload: JwtPayload) {
        const user = await this.authService.validateUser(payload);
        if (!user) {
            throw new TokenOwnerNotExistException();
        }
        if (user.tokenVerificationCode !== payload.tokenVerificationCode) {
            throw new TokenExpiredException();
        }

        return user;
    }
}
