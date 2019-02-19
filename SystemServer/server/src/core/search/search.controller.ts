import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SearchQueryDto, SearchType } from './dto/search-query.dto';
import { UserService } from '../user/user.service';
import { MeetingService } from '../meeting/meeting.service';
import { from, identity } from 'rxjs';
import { flatMap, filter, map, toArray } from 'rxjs/operators';
import { ObjectUtils } from '@commander/shared/utils/object.utils';
import { GetMeetingDto } from '../meeting/dto/get-meeting.dto';
import { SimpleUserDto } from '../user/dto/simple-user.dto';
import { Auth } from '@commander/shared/decorator/auth.decorator';
import { User } from '../user/user.model';
import { InstanceType } from 'typegoose';

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
            const meeting$ = from(
                this.meetingService.getAll({
                    $and: [
                        await this.meetingService.getQueryOption({}, user.id),
                        {
                            title: likeCondition,
                        },
                    ],
                }),
            ).pipe(
                flatMap(identity),
                filter(item => Boolean(item)),
                flatMap(item =>
                    item
                        .populate('owner invitations.user attendance.user')
                        .execPopulate(),
                ),
            );

            const sorted = this.meetingService.sortMeetings(meeting$);

            return sorted.pipe(
                map(item => ObjectUtils.DocumentToPlain(item, GetMeetingDto)),
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
            map(item => ObjectUtils.DocumentToPlain(item, SimpleUserDto)),
            toArray(),
            map(items => ({
                items,
                length: items.length,
            })),
        );
    }
}
