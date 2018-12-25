import { PipeTransform, ArgumentMetadata, Injectable } from '@nestjs/common';
import { Validator } from 'class-validator';

@Injectable()
export class FilterNotObjectIdStringPipe implements PipeTransform<string[]> {
    transform(arr: string[], metadata: ArgumentMetadata) {
        const validator = new Validator();
        const isMongoId = validator.isMongoId.bind(validator);
        return arr.filter(isMongoId);
    }
}
