import { PipeTransform, ArgumentMetadata, Injectable } from '@nestjs/common';
import { ValidationException } from '../exception/validation.exception';

@Injectable()
export class ParseIntPipe implements PipeTransform<string> {
    async transform(value: string, metadata: ArgumentMetadata) {
        const val = parseInt(value, 10);
        if (isNaN(val)) {
            throw new ValidationException(`${metadata.data} must be number`);
        }
        return val;
    }
}
