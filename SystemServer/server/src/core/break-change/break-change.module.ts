import { BreakChangeService } from './break-change.service';
import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';

@Module({
    imports: [UserModule],
    providers: [BreakChangeService],
})
export class BreakChangeModule {}
