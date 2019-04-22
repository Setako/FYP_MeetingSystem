import { Expose, Exclude, Type } from 'class-transformer';
import { SimpleUserDto } from '@commander/core/user/dto/simple-user.dto';

@Exclude()
export class BusyTimeDto {
    @Expose()
    @Type(() => Date)
    fromDate: Date;

    @Expose()
    @Type(() => Date)
    toDate: Date;

    @Expose()
    @Type(() => SimpleUserDto)
    users: SimpleUserDto[];

    @Expose()
    busyLevel: number;

    constructor(partial: Partial<BusyTimeDto>) {
        Object.assign(this, partial);
    }
}
