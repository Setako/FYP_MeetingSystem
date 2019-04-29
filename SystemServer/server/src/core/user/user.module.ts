import { Module, forwardRef } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { UsersController } from './user.controller';
import { User } from './user.model';
import { UserService } from './user.service';
import { GoogleModule } from '../google/google.module';
import { FaceService } from './face.service';
import { Face } from './face.model';

@Module({
    imports: [
        TypegooseModule.forFeature(User),
        TypegooseModule.forFeature(Face),
        forwardRef(() => GoogleModule),
    ],
    controllers: [UsersController],
    providers: [UserService, FaceService],
    exports: [UserService, FaceService],
})
export class UserModule {}
