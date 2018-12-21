import { UnauthorizedException } from '@nestjs/common';

export class TokenOwnerNotExistException extends UnauthorizedException {
    constructor(message = 'Owned token user may no longer exist') {
        super(message);
    }
}
