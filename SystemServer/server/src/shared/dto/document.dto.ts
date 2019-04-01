import { Expose, Exclude, Transform } from 'class-transformer';

import { Types } from 'mongoose';

export class DocumentDto {
    @Expose()
    @Transform((_val, obj) => obj._id.toHexString())
    id: string;

    @Exclude()
    _id!: Types.ObjectId;

    @Exclude()
    __v!: number;

    constructor(partial: Partial<DocumentDto>) {
        Object.assign(this, partial);
    }
}
