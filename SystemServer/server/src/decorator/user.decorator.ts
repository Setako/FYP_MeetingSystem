import { createParamDecorator } from '@nestjs/common';
import { User as UserModel } from '../core/user/user.model';

export const User = createParamDecorator((_, req) => req.user as UserModel);
