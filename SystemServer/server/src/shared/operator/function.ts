import { map, filter } from 'rxjs/operators';

export function maybe<T>(result: T) {
    return map<T, T>(item =>
        item === null || item === undefined ? result : item,
    );
}

export function skipFalsy<T>() {
    return filter<T>(item => item as any);
}
