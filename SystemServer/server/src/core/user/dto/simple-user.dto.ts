import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class SimpleUserDto {
    @Expose()
    username: string;

    @Expose()
    email: string;

    @Expose()
    displayName: string;

    constructor(partial: Partial<SimpleUserDto>) {
        Object.assign(this, partial);
    }
}
