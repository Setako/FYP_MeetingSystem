import { Exclude } from 'class-transformer';
import { GetUserDto } from '../../user/dto/get-user.dto';
import { EditFriendDto } from '../../user/dto/edit-friend.dto';
import { UserSetting } from '../../user/user.model';

export class GetOwnerDto extends GetUserDto {
    @Exclude()
    userMeetingRelation: [];

    @Exclude()
    friends: EditFriendDto[];

    @Exclude()
    setting: UserSetting;
}
