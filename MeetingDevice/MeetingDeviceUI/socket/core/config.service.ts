import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
    constructor() {}

    fromGlobal<T = any>(...keys: string[]): T {
        return this.from(global, ...keys);
    }

    fromEnvironment<T = any>(...keys: string[]): T {
        return this.from(process.env, ...keys);
    }

    private from(where: object, ...keys: string[]) {
        if (keys.length === 0 || !where) {
            return undefined;
        }

        if (keys.length === 1) {
            return where[keys[0]];
        }

        return keys
            .splice(1)
            .reduce(
                (item, key) => (item ? item[key] : undefined),
                where[keys[0]],
            );
    }
}
