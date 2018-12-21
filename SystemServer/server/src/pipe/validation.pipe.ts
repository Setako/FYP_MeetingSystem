import { Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ValidationException } from '../exception/validation.exception';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
    private isTransform: boolean;

    constructor({ transform = false }) {
        this.isTransform = transform;
    }

    async transform(value, metadata: ArgumentMetadata) {
        const { metatype } = metadata;

        if (!metatype || !this.toValidate(metadata)) {
            return value;
        }

        const object = plainToClass(metatype, value);
        const errors = await validate(object);
        if (errors.length > 0) {
            this.throwError(errors);
        }

        return this.isTransform ? object : value;
    }

    private toValidate({ metatype, type }: ArgumentMetadata): boolean {
        if (type === 'custom') {
            return false;
        }

        const types = [String, Boolean, Number, Array, Object];
        return !types.find(item => metatype === item);
    }

    private throwError(errors: ValidationError[]) {
        const { constraints, children } = errors[0];

        if (constraints) {
            const message = constraints[Object.keys(constraints)[0]];
            throw new ValidationException(message);
        }

        if (children) {
            return this.throwError(children);
        }

        throw new ValidationException();
    }
}
