import { GetUserDto } from '@commander/core/user/dto/get-user.dto';
import { UserSetting } from '@commander/core/user/user.model';
import { Exclude } from 'class-transformer';

export class GetOwnerDto extends GetUserDto {
    @Exclude()
    userMeetingRelation: [];

    @Exclude()
    setting: UserSetting;
}
