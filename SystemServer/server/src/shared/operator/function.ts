import { map, filter, flatMap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export function maybe<T>(result: T) {
    return map<T, T>(item =>
        item === null || item === undefined ? result : item,
    );
}

export function skipFalsy<T>() {
    return filter<T>(item => item as any);
}

export function combine<T, K>(caller: (t: T) => Observable<K>) {
    return flatMap<T, Observable<[T, K]>>(t =>
        caller(t).pipe(map(k => [t, k] as [T, K])),
    );
}
