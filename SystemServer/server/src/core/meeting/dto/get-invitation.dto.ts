import { Exclude, Type } from 'class-transformer';
import { SimpleUserDto } from '@commander/core/user/dto/simple-user.dto';

@Exclude()
export class GetInvitationDto {
    id: string;

    @Type(() => SimpleUserDto)
    user?: SimpleUserDto;

    email?: string;

    status: string;

    constructor(partial: Partial<GetInvitationDto>) {
        Object.assign(this, partial);
    }
}
