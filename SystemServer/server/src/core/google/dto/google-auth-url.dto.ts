import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class GoogleAuthUrlDto {
    @Expose()
    readonly url!: string;

    constructor(partial: Partial<GoogleAuthUrlDto>) {
        Object.assign(this, partial);
    }
}
