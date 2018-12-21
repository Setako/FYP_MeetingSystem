import { BadRequestException } from '@nestjs/common';

export class EmailUsedExistException extends BadRequestException {
    constructor(message = 'Email has been used') {
        super(message);
    }
}
