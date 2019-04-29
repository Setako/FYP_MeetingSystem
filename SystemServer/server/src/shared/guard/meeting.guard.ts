import { MeetingService } from '@commander/core/meeting/meeting.service';
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { of } from 'rxjs';
import { catchError, tap, flatMap } from 'rxjs/operators';

@Injectable()
export class MeetingGuard implements CanActivate {
    constructor(private readonly meetingService: MeetingService) {}

    canActivate(context: ExecutionContext) {
        const {
            user,
            params: { id },
        } = context.switchToHttp().getRequest();

        return this.meetingService.countDocumentsByIds([id]).pipe(
            catchError(() => of(0)),
            tap(item => {
                if (item === 0) {
                    throw new NotFoundException('Meeting does not exist');
                }
            }),
            flatMap(() => this.meetingService.hasViewPermission(id, user.id)),
        );
    }
}
