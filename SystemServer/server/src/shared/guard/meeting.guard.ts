import { MeetingService } from '@commander/core/meeting/meeting.service';
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { from } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class MeetingGuard implements CanActivate {
    constructor(private readonly meetingService: MeetingService) {}

    async canActivate(context: ExecutionContext) {
        const { id } = context.switchToHttp().getRequest().params;

        const meeting = await from(this.meetingService.getById(id))
            .pipe(
                catchError(() => {
                    throw new NotFoundException('Meeting does not exist');
                }),
            )
            .toPromise();

        if (!meeting) {
            throw new NotFoundException('Meeting does not exist');
        }

        return true;
    }
}
