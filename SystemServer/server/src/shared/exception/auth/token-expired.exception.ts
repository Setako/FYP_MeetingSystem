import { UnauthorizedException } from '@nestjs/common';

export class TokenExpiredException extends UnauthorizedException {
    constructor(message = 'Token is expired or fake') {
        super(message);
    }
}
