import { Expose, Exclude, Type } from 'class-transformer';

@Exclude()
export class SuggestTimeDto {
    @Expose()
    @Type(() => Date)
    fromDate: Date;

    @Expose()
    @Type(() => Date)
    toDate: Date;

    @Expose()
    busyLevel: number;

    constructor(partial: Partial<SuggestTimeDto>) {
        Object.assign(this, partial);
    }
}
