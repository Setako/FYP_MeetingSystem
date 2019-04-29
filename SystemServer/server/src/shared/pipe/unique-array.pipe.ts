import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class UniqueArrayPipe<T> implements PipeTransform<T[]> {
    transform(arr: T[], metadata: ArgumentMetadata) {
        return [...new Set(arr)];
    }
}
