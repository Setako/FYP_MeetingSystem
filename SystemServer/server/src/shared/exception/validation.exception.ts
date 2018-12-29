import { BadRequestException } from '@nestjs/common';

export class ValidationException extends BadRequestException {
    constructor(message = 'Validation failed') {
        super(message);
    }
}
