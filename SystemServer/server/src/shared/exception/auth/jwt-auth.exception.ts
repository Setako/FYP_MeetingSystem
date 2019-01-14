import { UnauthorizedException } from '@nestjs/common';

export class JwtAuthException extends UnauthorizedException {
    constructor(message = 'Token is expired or fake') {
        super(message);
    }
}
