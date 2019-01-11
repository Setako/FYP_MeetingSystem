import { MeetingService } from '@commander/core/meeting/meeting.service';
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { from, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable()
export class MeetingGuard implements CanActivate {
    constructor(private readonly meetingService: MeetingService) {}

    canActivate(context: ExecutionContext) {
        const { id } = context.switchToHttp().getRequest().params;

        return from(this.meetingService.countDocumentsByIds([id])).pipe(
            catchError(() => of(0)),
            map(item => item !== 0),
            tap(item => {
                if (!item) {
                    throw new NotFoundException('Meeting does not exist');
                }
            }),
        );
    }
}
