import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class SplitSemicolonPipe implements PipeTransform<string> {
    transform(value: string, metadata: ArgumentMetadata) {
        return value.split(';');
    }
}
