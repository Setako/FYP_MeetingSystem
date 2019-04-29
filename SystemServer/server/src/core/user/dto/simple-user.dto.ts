import { Exclude, Expose, Transform } from 'class-transformer';
import { Types } from 'mongoose';

@Exclude()
export class SimpleUserDto {
    @Expose()
    @Transform((_val, obj) => obj._id.toHexString())
    id: string;

    @Exclude()
    _id: Types.ObjectId;

    @Expose()
    username!: string;

    @Expose()
    email!: string;

    @Expose()
    displayName!: string;

    constructor(partial: Partial<SimpleUserDto>) {
        Object.assign(this, partial);
    }
}
