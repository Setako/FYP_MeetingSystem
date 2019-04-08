import { Exclude, Expose, Transform } from 'class-transformer';
import { Types } from 'mongoose';

@Exclude()
export class FaceDto {
    @Exclude()
    _id!: Types.ObjectId;

    @Expose()
    @Transform((_val, obj) => obj._id.toHexString())
    id: string;

    @Expose()
    name!: string;

    @Expose()
    imagePath!: string;

    @Expose()
    resultPath: string;

    @Expose()
    @Transform(val => val.toHexString())
    owner: string;

    constructor(partial: Partial<FaceDto>) {
        Object.assign(this, partial);
    }
}
