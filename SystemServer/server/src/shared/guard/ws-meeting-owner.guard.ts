import { Injectable, ExecutionContext } from '@nestjs/common';
import { MeetingOwnerGuard } from './meeting-owner.guard';

@Injectable()
export class WsMeetingOwnerGuard extends MeetingOwnerGuard {
    canActivate(context: ExecutionContext) {
        const { meetingId } = context.switchToWs().getData();
        const {
            request: { user },
        } = context.switchToWs().getClient();

        return this.validate(meetingId, user.id);
    }
}
