import { promises } from 'fs';
import { dirname, normalize, sep } from 'path';
import { from, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export class FileUtils {
    static async mkdir(file: string, options = { recursive: true }) {
        return (
            (await from(promises.mkdir(dirname(file), options))
                .pipe(catchError(() => of(false)))
                .toPromise()) !== false
        );
    }

    static async writeFile(file: string, data: any) {
        return (
            (await from(promises.writeFile(file, data))
                .pipe(catchError(() => of(false)))
                .toPromise()) !== false
        );
    }

    static getRoot(file: string) {
        return normalize(process.cwd() + sep + file);
    }

    static normalize(file: string) {
        return normalize(file);
    }

    static async getFileBuffer(file: string, options = {}) {
        return from(promises.readFile(file, options))
            .pipe(catchError(() => of(null)))
            .toPromise();
    }

    static async readdir(file: string, options = {}) {
        return from(promises.readdir(file, options))
            .pipe(catchError(() => of([] as string[])))
            .toPromise();
    }

    static async findFileInPathStartWith(startWith: string, path: string) {
        const list = await FileUtils.readdir(path);
        return list.find(item => item.startsWith(startWith));
    }

    static async deleteFile(file: string) {
        return promises.unlink(file);
    }
}
