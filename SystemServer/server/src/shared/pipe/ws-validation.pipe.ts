import { Injectable } from '@nestjs/common';
import { ValidationPipe } from './validation.pipe';
import { ValidationError } from 'class-validator';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsValidationPipe extends ValidationPipe {
    protected throwError(errors: ValidationError[]) {
        const { constraints, children } = errors[0];

        if (constraints) {
            const message = constraints[Object.keys(constraints)[0]];
            throw new WsException(message);
        }

        if (children) {
            return this.throwError(children);
        }

        throw new WsException('Validation error');
    }
}
