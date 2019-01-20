import { Exclude, Type, Expose } from 'class-transformer';
import { SimpleUserDto } from '@commander/core/user/dto/simple-user.dto';
import { InvitationStatus } from '../meeting.model';

@Exclude()
export class GetInvitationDto {
    @Expose()
    id!: string;

    @Expose()
    @Type(() => SimpleUserDto)
    user?: SimpleUserDto;

    @Expose()
    email?: string;

    @Expose()
    status!: InvitationStatus;

    constructor(partial: Partial<GetInvitationDto>) {
        Object.assign(this, partial);
    }
}
