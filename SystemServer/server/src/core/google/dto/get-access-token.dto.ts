import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class GetAccessTokenDto {
    @Expose()
    token!: string;

    constructor(partial: Partial<GetAccessTokenDto>) {
        Object.assign(this, partial);
    }
}
