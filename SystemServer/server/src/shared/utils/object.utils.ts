import { classToPlain } from 'class-transformer';
import { Document } from 'mongoose';

export class ObjectUtils {
    static DocumentToPlain<T extends Document, U = object>(
        document: T,
        transform?: new (...args: any[]) => U,
    ): U {
        return ObjectUtils.ObjectToPlain(document.toObject(), transform);
    }

    static ObjectToPlain<T extends object, U = T>(
        source: T,
        transform?: new (...args: any[]) => U,
    ): U {
        return transform
            ? classToPlain(new transform(source))
            : (classToPlain(source) as any);
    }
}
