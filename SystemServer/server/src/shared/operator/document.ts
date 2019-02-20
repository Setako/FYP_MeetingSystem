import { flatMap, map } from 'rxjs/operators';
import { ObjectUtils } from '../utils/object.utils';
import { Document, ModelPopulateOptions } from 'mongoose';

export function populate<T extends Document>(
    ...populates: Array<string | ModelPopulateOptions>
) {
    return flatMap<T, Promise<T>>(item =>
        populates
            .reduce((acc: T, cur: any) => acc.populate(cur), item)
            .execPopulate(),
    );
}

export function documentToPlain<U = object>(
    transform?: new (...args: any[]) => U,
) {
    return map<Document, U>(item =>
        ObjectUtils.DocumentToPlain(item, transform),
    );
}
