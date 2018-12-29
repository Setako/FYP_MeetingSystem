import { classToPlain } from 'class-transformer';
import { Document } from 'mongoose';

export class ObjectUtils {
    static DocumentToPlain(
        document: Document,
        transform?: new (...args: any[]) => any,
    ) {
        return transform
            ? classToPlain(new transform(document.toObject()))
            : classToPlain(document.toObject());
    }
}
