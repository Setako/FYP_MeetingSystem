import { Module, NestModule } from '@nestjs/common';
import { User } from './user.model';
import { TypegooseModule } from 'nestjs-typegoose';
import { UsersController } from './user.controller';
import { UserService } from './user.service';

@Module({
    imports: [TypegooseModule.forFeature(User)],
    controllers: [UsersController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule {}
