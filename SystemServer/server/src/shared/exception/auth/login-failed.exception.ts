import { UnauthorizedException } from '@nestjs/common';

export class LoginFailedException extends UnauthorizedException {
    constructor(message = 'Incorrect username or password') {
        super(message);
    }
}
