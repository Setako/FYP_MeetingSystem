import { ValidationException } from '../exception/validation.exception';

export class NumberUtils {
    static parseOr(value: string, except: number) {
        const val = parseInt(value, 10);
        return isNaN(val) ? except : val;
    }

    static parseOrThrow(value: string, message?: string) {
        const val = parseInt(value, 10);
        if (isNaN(val)) {
            throw new ValidationException(message);
        }
        return val;
    }
}
