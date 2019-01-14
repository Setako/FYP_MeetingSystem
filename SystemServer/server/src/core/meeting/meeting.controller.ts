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
    BadRequestException,
    HttpStatus,
    HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../user/user.model';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { EditMeetingDto } from './dto/edit-meeting.dto';
import { MeetingQueryDto } from './dto/meeting-query.dto';
import { GetMeetingDto } from './dto/get-meeting.dto';
import { InvitationsDto } from './dto/invitations.dto';
import { MeetingService } from './meeting.service';
import { defer, identity, from, combineLatest, pipe } from 'rxjs';
import {
    flatMap,
    filter,
    map,
    toArray,
    mapTo,
    switchMap,
    tap,
} from 'rxjs/operators';
import { InstanceType } from 'typegoose';
import { GetInvitationDto } from './dto/get-invitation.dto';
import { MeetingOwnerGuard } from '@commander/shared/guard/meeting-owner.guard';
import { Types } from 'mongoose';
import { InvitationStatus } from './meeting.model';
import { AcceptDto } from '@commander/shared/dto/accept.dto';

@Controller('meeting')
@UseGuards(AuthGuard('jwt'))
export class MeetingController {
    constructor(private readonly meetingService: MeetingService) {}

    @Get()
    async getAll(
        @Query() query: MeetingQueryDto,
        @Auth() user: InstanceType<User>,
    ) {
        const options = await this.meetingService.getQueryOption(
            query,
            user.id,
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
            flatMap(item =>
                item.populate('owner invitations.user').execPopulate(),
            ),
        );

        const items = list.pipe(
            map(item => ObjectUtils.DocumentToPlain(item, GetMeetingDto)),
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
        @Auth() user: InstanceType<User>,
        @Param(
            'ids',
            new SplitSemicolonPipe(),
            new FilterNotObjectIdStringPipe(),
        )
        ids: string[],
        @Query() query,
    ) {
        const { resultPageNum = 1, resultPageSize } = query;

        ids = await from(ids)
            .pipe(
                switchMap(id =>
                    from(
                        this.meetingService.hasViewPermission(id, user.id),
                    ).pipe(
                        filter(Boolean),
                        mapTo(id),
                    ),
                ),
                toArray(),
            )
            .toPromise();

        const list = defer(() =>
            resultPageSize
                ? this.meetingService.getByIdsWithPage(
                      ids,
                      NumberUtils.parseOrThrow(resultPageSize),
                      NumberUtils.parseOrThrow(resultPageNum),
                  )
                : this.meetingService.getByIds(ids),
        ).pipe(
            flatMap(identity),
            flatMap(item =>
                item.populate('owner invitations.user').execPopulate(),
            ),
        );

        const items = list.pipe(
            map(item => ObjectUtils.DocumentToPlain(item, GetMeetingDto)),
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
        return from(this.meetingService.create(meeting, owner)).pipe(
            flatMap(item =>
                item.populate('owner invitations.user').execPopulate(),
            ),
            map(item => ObjectUtils.DocumentToPlain(item, GetMeetingDto)),
        );
    }

    @Put(':id')
    @UseGuards(MeetingOwnerGuard)
    @UseGuards(MeetingGuard)
    async edit(
        @Param('id') id: string,
        @Body() editMeetingDto: EditMeetingDto,
    ) {
        return from(this.meetingService.edit(id, editMeetingDto)).pipe(
            map(item => item!._id),
            flatMap(_id =>
                this.meetingService
                    .findAll({ _id: { $eq: _id } })
                    .populate('owner invitations.user')
                    .exec(),
            ),
            flatMap(identity),
            map(item => ObjectUtils.DocumentToPlain(item, GetMeetingDto)),
        );
    }

    @Delete(':id')
    @UseGuards(MeetingOwnerGuard)
    @UseGuards(MeetingGuard)
    async delete(@Param('id') id: string) {
        await this.meetingService.delete(id);
    }

    @Put(':id/invitation')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(MeetingGuard)
    async acceptOrRejctInvitation(
        @Auth() user: InstanceType<User>,
        @Param('id') id: string,
        @Body() acceptDto: AcceptDto,
    ) {
        const isInvited$ = from(
            this.meetingService.countDocuments({
                _id: Types.ObjectId(id),
                'invitation.user': user._id,
                'invitation.status': { $in: [InvitationStatus.Waiting] },
            }),
        ).pipe(
            tap(item => {
                if (item === 0) {
                    throw new BadRequestException(
                        'You have not been invited to this meeting or have accepted or rejected this invitation.',
                    );
                }
            }),
        );

        await isInvited$
            .pipe(
                flatMap(() =>
                    this.meetingService.acceptOrRejectInvitation(
                        id,
                        user.id,
                        acceptDto.accept,
                    ),
                ),
            )
            .toPromise();
    }

    @Get(':id/participant')
    @UseGuards(MeetingGuard)
    async getInvitation(@Param('id') id: string) {
        return from(this.meetingService.getById(id)).pipe(
            flatMap(item => item!.populate('invitations.user').execPopulate()),
            map(
                pipe(
                    item => item.toObject(),
                    ({ invitations }) => ({
                        items: invitations.map((item: object) =>
                            ObjectUtils.ObjectToPlain(item, GetInvitationDto),
                        ),
                        length: invitations.length,
                    }),
                ),
            ),
        );
    }

    @Put(':id/participant')
    @UseGuards(MeetingOwnerGuard)
    @UseGuards(MeetingGuard)
    async editInvitation(
        @Param('id') id: string,
        @Body() invitationDto: InvitationsDto,
    ) {
        return from(
            this.meetingService.editInvitations(id, invitationDto),
        ).pipe(
            flatMap(item => item!.populate('invitations.user').execPopulate()),
            map(
                pipe(
                    item => item.toObject(),
                    ({ invitations }) => ({
                        items: invitations.map((item: object) =>
                            ObjectUtils.ObjectToPlain(item, GetInvitationDto),
                        ),
                        length: invitations.length,
                    }),
                ),
            ),
        );
    }

    @Put(':id/calendar')
    @UseGuards(MeetingGuard)
    async markOrUnMarkCalendar() {
        // Todo: mark the calendar
    }
}
