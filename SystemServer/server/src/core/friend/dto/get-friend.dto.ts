import { GetOwnerDto } from '@commander/core/meeting/dto/get-owner.dto';
import { Type } from 'class-transformer';

export class GetFriendDto {
    @Type(() => GetOwnerDto)
    user: GetOwnerDto;

    addDate: Date;

    stared: boolean;

    constructor(partial: Partial<GetFriendDto>) {
        this.user = partial.user;
        this.addDate = partial.addDate;
        this.stared = partial.stared;
    }
}
