import {
    Injectable,
    ArgumentMetadata,
    PipeTransform,
    Optional,
} from '@nestjs/common';
import { plainToClass, classToPlain } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsValidationPipe implements PipeTransform<any> {
    constructor(@Optional() private readonly isTransform: boolean = true) {}

    async transform(value: any, metadata: ArgumentMetadata) {
        const { metatype } = metadata;

        if (!metatype || !this.toValidate(metadata)) {
            return value;
        }

        value = classToPlain(value);
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
            throw new WsException(message);
        }

        if (children) {
            return this.throwError(children);
        }

        throw new WsException('Validation error');
    }
}
