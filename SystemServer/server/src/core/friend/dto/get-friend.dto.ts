import { Type } from 'class-transformer';
import { GetOwnerDto } from '../../meeting/dto/get-owner.dto';

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
