import {
    Controller,
    Get,
    Post,
    Body,
    UseGuards,
    Query,
    Param,
    Put,
    Delete,
} from '@nestjs/common';
import { MeetingService } from './meeting.service';
import { AuthGuard } from '@nestjs/passport';
import { NumberUtils } from '../../utils/number.utils';
import { ObjectUtils } from '../../utils/object.utils';
import { GetMeetingDto } from './dto/get-meeting.dto';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { User } from '../../decorator/user.decorator';
import { User as UserModel } from '../user/user.model';
import { SplitSemicolonPipe } from '../../pipe/split-semicolon.pipe';
import { EditMeetingDto } from './dto/edit-meeting.dto';
import { UserService } from '../user/user.service';
import { ObjectId } from 'bson';
import { classToPlain } from 'class-transformer';
import { InvitationsDto } from './dto/invitations.dto';
import { MeetingGuard } from '../../guard/meeting.guard';
import { FilterNotObjectIdStringPipe } from '../../pipe/filter-not-object-id-string.pipe';
import { GetAllQueryDto } from './dto/get-all-query.dto';
import { GetUserDto } from '../user/dto/get-user.dto';
import { GetOwnerDto } from './dto/owner.dto';

@Controller('meeting')
@UseGuards(AuthGuard('jwt'))
export class MeetingController {
    constructor(
        private readonly meetingService: MeetingService,
        private readonly userService: UserService,
    ) {}

    @Get()
    async getAll(@Query() query: GetAllQueryDto, @User() user: UserModel) {
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
                        (val.owner as ObjectId).toHexString(),
                    ),
                    GetOwnerDto,
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
                        (val.owner as ObjectId).toHexString(),
                    ),
                    GetOwnerDto,
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
    async create(@User() owner: UserModel, @Body() meeting: CreateMeetingDto) {
        const created = await this.meetingService.create(meeting, owner);
        return ObjectUtils.DocumentToPlain(created, GetMeetingDto);
    }

    @Put(':id')
    @UseGuards(MeetingGuard)
    async edit(
        @Param('id') id: string,
        @Body() editMeetingDto: EditMeetingDto,
    ) {
        const edited = await this.meetingService.edit(id, editMeetingDto);
        return ObjectUtils.DocumentToPlain(edited, GetMeetingDto);
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
}
