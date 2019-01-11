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
import { GetAllQueryDto } from './dto/get-all-query.dto';
import { GetMeetingDto } from './dto/get-meeting.dto';
import { InvitationsDto } from './dto/invitations.dto';
import { MeetingService } from './meeting.service';
import { SimpleUserDto } from '../user/dto/simple-user.dto';

@Controller('meeting')
@UseGuards(AuthGuard('jwt'))
export class MeetingController {
    constructor(
        private readonly meetingService: MeetingService,
        private readonly userService: UserService,
    ) {}

    @Get()
    async getAll(@Query() query: GetAllQueryDto, @Auth() user: User) {
        const options = await this.meetingService.getQueryOption(
            query,
            user.username,
        );

        let items = query.resultPageSize
            ? await this.meetingService.getAllWithPage(
                  NumberUtils.parseOrThrow(query.resultPageSize),
                  NumberUtils.parseOr(query.resultPageNum, 1),
                  options,
              )
            : await this.meetingService.getAll(options);

        items = await Promise.all(
            items.filter(Boolean).map(async val => ({
                ...val.toObject(),
                owner: ObjectUtils.DocumentToPlain(
                    await this.userService.getById(
                        (val.owner as Types.ObjectId).toHexString(),
                    ),
                    SimpleUserDto,
                ),
            })),
        );

        const length = await this.meetingService.countDocuments(options);

        return {
            items: items
                .filter(item => item.owner)
                .map(item => classToPlain(new GetMeetingDto(item))),
            resultPageNum: NumberUtils.parseOr(query.resultPageNum, 1),
            length,
        };
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

        let items = resultPageSize
            ? await this.meetingService.getByIdsWithPage(
                  ids,
                  NumberUtils.parseOrThrow(resultPageSize),
                  NumberUtils.parseOrThrow(resultPageNum),
              )
            : await this.meetingService.getByIds(ids);

        items = await Promise.all(
            items.filter(Boolean).map(async val => ({
                ...val.toObject(),
                owner: ObjectUtils.DocumentToPlain(
                    await this.userService.getById(
                        (val.owner as Types.ObjectId).toHexString(),
                    ),
                    SimpleUserDto,
                ),
            })),
        );

        const length = await this.meetingService.countDocumentsByIds(ids);

        return {
            items: items
                .filter(item => item.owner)
                .map(item => classToPlain(new GetMeetingDto(item))),
            resultPageNum: NumberUtils.parseOr(resultPageNum, 1),
            length,
        };
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
        const meeting = await this.meetingService.getById(id);
        return {
            items: meeting.invitations,
            length: meeting.invitations.length,
        };
    }

    @Put(':id/participant')
    @UseGuards(MeetingGuard)
    async editInvitation(
        @Param('id') id: string,
        @Body() invitationDto: InvitationsDto,
    ) {
        const meeting = await this.meetingService.editInvitations(
            id,
            invitationDto,
        );
        return {
            items: meeting.invitations,
            length: meeting.invitations.length,
        };
    }

    @Put(':id/calendar')
    @UseGuards(MeetingGuard)
    async markOrUnMarkCalendar() {
        // Todo: mark the calendar
    }
}
