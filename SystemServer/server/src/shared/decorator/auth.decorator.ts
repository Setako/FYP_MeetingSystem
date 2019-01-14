import { User } from '@commander/core/user/user.model';
import { createParamDecorator } from '@nestjs/common';

export const Auth = createParamDecorator((_, req) => req.user as User);
