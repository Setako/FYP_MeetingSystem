import { PipeTransform, ArgumentMetadata, Injectable } from '@nestjs/common';
import { ObjectId } from 'bson';

@Injectable()
export class FilterNotObjectIdStringPipe implements PipeTransform<string[]> {
    async transform(arr: string[], metadata: ArgumentMetadata) {
        return arr
            .map(item => {
                try {
                    const _ = new ObjectId(item);
                    return item;
                } catch {
                    return null;
                }
            })
            .filter(Boolean);
    }
}
