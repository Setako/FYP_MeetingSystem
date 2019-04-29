import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SearchQueryDto, SearchType } from './dto/search-query.dto';
import { UserService } from '../user/user.service';
import { MeetingService } from '../meeting/meeting.service';
import { map, toArray } from 'rxjs/operators';
import { GetMeetingDto } from '../meeting/dto/get-meeting.dto';
import { SimpleUserDto } from '../user/dto/simple-user.dto';
import { Auth } from '@commander/shared/decorator/auth.decorator';
import { User } from '../user/user.model';
import { InstanceType } from 'typegoose';
import { skipFalsy } from '@commander/shared/operator/function';
import { populate, documentToPlain } from '@commander/shared/operator/document';

@Controller('search')
export class SearchController {
    constructor(
        private readonly userService: UserService,
        private readonly meetingService: MeetingService,
    ) {}

    @Get()
    @UseGuards(AuthGuard('jwt'))
    async getAll(
        @Auth() user: InstanceType<User>,
        @Query() query: SearchQueryDto,
    ) {
        const likeCondition = { $regex: query.q, $options: 'i' };

        if (query.type === SearchType.Meeting) {
            const meeting$ = this.meetingService
                .getAll({
                    $and: [
                        await this.meetingService.getQueryOption({}, user.id),
                        {
                            title: likeCondition,
                        },
                    ],
                })
                .pipe(
                    skipFalsy(),
                    populate('owner', 'invitations.user', 'attendance.user'),
                );

            const sorted$ = this.meetingService.sortMeetings(meeting$);

            return sorted$.pipe(
                documentToPlain(GetMeetingDto),
                toArray(),
                map(items => ({
                    items,
                    length: items.length,
                })),
            );
        }

        const user$ = this.userService.getAll({
            $or: [
                {
                    username: likeCondition,
                },
                {
                    displayName: likeCondition,
                },
            ],
        });

        return user$.pipe(
            documentToPlain(SimpleUserDto),
            toArray(),
            map(items => ({
                items,
                length: items.length,
            })),
        );
    }
}
