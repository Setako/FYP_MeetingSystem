import { BadRequestException } from '@nestjs/common';

export class UsernameUsedExistException extends BadRequestException {
    constructor(message = 'Username has been used') {
        super(message);
    }
}
