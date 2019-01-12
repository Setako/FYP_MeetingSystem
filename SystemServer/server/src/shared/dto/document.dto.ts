import { Expose, Exclude } from 'class-transformer';

import { Types } from 'mongoose';

export class DocumentDto {
    @Expose()
    get id(): string {
        return this._id.toHexString();
    }

    @Exclude()
    _id: Types.ObjectId;

    @Exclude()
    __v: number;

    constructor(partial: Partial<DocumentDto>) {
        Object.assign(this, partial);
    }
}
