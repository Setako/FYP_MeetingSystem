import { Auth } from '@commander/shared/decorator/auth.decorator';
import { MeetingGuard } from '@commander/shared/guard/meeting.guard';
import { FilterNotObjectIdStringPipe } from '@commander/shared/pipe/filter-not-object-id-string.pipe';
import { SplitSemicolonPipe } from '@commander/shared/pipe/split-semicolon.pipe';
import { NumberUtils } from '@commander/shared/utils/number.utils';
import { ObjectUtils } from '@commander/shared/utils/object.utils';
import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { classToPlain } from 'class-transformer';
import { Types } from 'mongoose';
import { User } from '../user/user.model';
import { UserService } from '../user/user.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { EditMeetingDto } from './dto/edit-meeting.dto';
import { MeetingQueryDto } from './dto/meeting-query.dto';
import { GetMeetingDto } from './dto/get-meeting.dto';
import { InvitationsDto } from './dto/invitations.dto';
import { MeetingService } from './meeting.service';
import { SimpleUserDto } from '../user/dto/simple-user.dto';
import { defer, identity, zip, from, combineLatest, pipe } from 'rxjs';
import { flatMap, filter, map, toArray } from 'rxjs/operators';

@Controller('meeting')
@UseGuards(AuthGuard('jwt'))
export class MeetingController {
    constructor(
        private readonly meetingService: MeetingService,
        private readonly userService: UserService,
    ) {}

    @Get()
    async getAll(@Query() query: MeetingQueryDto, @Auth() user: User) {
        const options = await this.meetingService.getQueryOption(
            query,
            user.username,
        );

        const list = defer(() =>
            query.resultPageSize
                ? this.meetingService.getAllWithPage(
                      NumberUtils.parseOrThrow(query.resultPageSize),
                      NumberUtils.parseOr(query.resultPageNum, 1),
                      options,
                  )
                : this.meetingService.getAll(options),
        ).pipe(
            flatMap(identity),
            filter(item => Boolean(item)),
        );

        const owners = list.pipe(
            flatMap(item =>
                this.userService.getById(
                    (item.owner as Types.ObjectId).toHexString(),
                ),
            ),
        );

        const items = zip(list, owners).pipe(
            map(
                pipe(
                    ([meeting, owner]) => ({
                        ...meeting.toObject(),
                        owner: ObjectUtils.DocumentToPlain(
                            owner,
                            SimpleUserDto,
                        ),
                    }),
                    item => new GetMeetingDto(item),
                    item => classToPlain(item),
                ),
            ),
        );

        const length = from(this.meetingService.countDocuments(options));

        return combineLatest(items.pipe(toArray()), length).pipe(
            map(([itemList, totalLength]) => ({
                items: itemList,
                length: totalLength,
                resultPageNum: NumberUtils.parseOr(query.resultPageNum, 1),
            })),
        );
    }

    @Get(':ids')
    async get(
        @Param(
            'ids',
            new SplitSemicolonPipe(),
            new FilterNotObjectIdStringPipe(),
        )
        ids: string[],
        @Query() query,
    ) {
        const { resultPageNum = 1, resultPageSize } = query;

        const list = defer(() =>
            resultPageSize
                ? this.meetingService.getByIdsWithPage(
                      ids,
                      NumberUtils.parseOrThrow(resultPageSize),
                      NumberUtils.parseOrThrow(resultPageNum),
                  )
                : this.meetingService.getByIds(ids),
        ).pipe(flatMap(identity));

        const owners = list.pipe(
            flatMap(
                pipe(
                    item => (item.owner as Types.ObjectId).toHexString(),
                    item => this.userService.getById(item),
                ),
            ),
        );

        const items = zip(list, owners).pipe(
            map(
                pipe(
                    ([meeting, owner]) => ({
                        ...meeting.toObject(),
                        owner: ObjectUtils.DocumentToPlain(
                            owner,
                            SimpleUserDto,
                        ),
                    }),
                    item => new GetMeetingDto(item),
                    item => classToPlain(item),
                ),
            ),
        );
        const length = from(this.meetingService.countDocumentsByIds(ids));

        return combineLatest(items.pipe(toArray()), length).pipe(
            map(([itemList, totalLength]) => ({
                items: itemList,
                length: totalLength,
                resultPageNum: NumberUtils.parseOr(query.resultPageNum, 1),
            })),
        );
    }

    @Post()
    async create(@Auth() owner: User, @Body() meeting: CreateMeetingDto) {
        const created = await this.meetingService.create(meeting, owner);

        const object = {
            ...created.toObject(),
            owner: ObjectUtils.DocumentToPlain(
                created.owner as any,
                SimpleUserDto,
            ),
        };

        return classToPlain(new GetMeetingDto(object));
    }

    @Put(':id')
    @UseGuards(MeetingGuard)
    async edit(
        @Param('id') id: string,
        @Body() editMeetingDto: EditMeetingDto,
    ) {
        const edited = await this.meetingService.edit(id, editMeetingDto);

        const object = {
            ...edited.toObject(),
            owner: ObjectUtils.DocumentToPlain(
                await this.userService.getById(
                    (edited.owner as Types.ObjectId).toHexString(),
                ),
                SimpleUserDto,
            ),
        };

        return classToPlain(new GetMeetingDto(object));
    }

    @Delete(':id')
    @UseGuards(MeetingGuard)
    async delete(@Param('id') id: string) {
        await this.meetingService.delete(id);
    }

    @Get(':id/participant')
    @UseGuards(MeetingGuard)
    async getInvitation(@Param('id') id: string) {
        return from(this.meetingService.getById(id)).pipe(
            map(({ invitations }) => ({
                items: invitations,
                length: invitations.length,
            })),
        );
    }

    @Put(':id/participant')
    @UseGuards(MeetingGuard)
    async editInvitation(
        @Param('id') id: string,
        @Body() invitationDto: InvitationsDto,
    ) {
        return from(
            this.meetingService.editInvitations(id, invitationDto),
        ).pipe(
            map(({ invitations }) => ({
                items: invitations,
                length: invitations.length,
            })),
        );
    }

    @Put(':id/calendar')
    @UseGuards(MeetingGuard)
    async markOrUnMarkCalendar() {
        // Todo: mark the calendar
    }
}
