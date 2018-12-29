import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { UsersController } from './user.controller';
import { User } from './user.model';
import { UserService } from './user.service';

@Module({
    imports: [TypegooseModule.forFeature(User)],
    controllers: [UsersController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule {}
