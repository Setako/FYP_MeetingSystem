import { GetUserDto } from './get-user.dto';
import { UserSetting } from '../user.model';
import { Exclude } from 'class-transformer';

export class GetAllUserDto extends GetUserDto {
    @Exclude()
    setting: UserSetting;

    @Exclude()
    userMeetingRelation: [];
}
