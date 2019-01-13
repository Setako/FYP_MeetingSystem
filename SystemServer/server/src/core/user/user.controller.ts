import { UserGuard } from '@commander/shared/guard/user.guard';
import { SplitSemicolonPipe } from '@commander/shared/pipe/split-semicolon.pipe';
import { FileUtils } from '@commander/shared/utils/file.utils';
import { NumberUtils } from '@commander/shared/utils/number.utils';
import { ObjectUtils } from '@commander/shared/utils/object.utils';
import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    Post,
    Put,
    Query,
    Res,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import parseDataURL from 'data-urls';
import { Response } from 'express';
import { EditUserDto } from './dto/edit-user.dto';
import { UserDto } from './dto/user.dto';
import { UploadAratarDto } from './dto/upload-aratar.dto';
import { UserService } from './user.service';
import { SelfGuard } from '@commander/shared/guard/self.guard';
import { defer, combineLatest, from, identity } from 'rxjs';
import { map, flatMap, filter, toArray } from 'rxjs/operators';
import { SimpleUserDto } from './dto/simple-user.dto';
import { Auth } from '@commander/shared/decorator/auth.decorator';
import { User } from './user.model';
import { InstanceType } from 'typegoose';

@Controller('user')
export class UsersController {
    constructor(private readonly userService: UserService) {}

    @Get()
    @UseGuards(AuthGuard('jwt'))
    async getAll(@Query() query) {
        const { resultPageNum, resultPageSize } = query;

        const items = defer(() =>
            resultPageSize
                ? this.userService.getAllWithPage(
                      NumberUtils.parseOrThrow(resultPageSize),
                      NumberUtils.parseOr(resultPageNum, 1),
                  )
                : this.userService.getAll(),
        ).pipe(
            map(item =>
                item.map(val =>
                    ObjectUtils.DocumentToPlain(val, SimpleUserDto),
                ),
            ),
        );

        const length = from(this.userService.countDocuments());

        return combineLatest(items, length).pipe(
            map(([itemList, totalLength]) => ({
                items: itemList,
                length: totalLength,
                resultPageNum: NumberUtils.parseOr(resultPageNum, 1),
            })),
        );
    }

    @Get(':usernames')
    @UseGuards(AuthGuard('jwt'))
    async get(
        @Auth() user: InstanceType<User>,
        @Param('usernames', new SplitSemicolonPipe()) usernames: string[],
        @Query() query,
    ) {
        const { resultPageNum = 1, resultPageSize } = query;

        const list = defer(() =>
            resultPageSize
                ? this.userService.getByUsernamesWithPage(
                      usernames,
                      NumberUtils.parseOrThrow(resultPageSize),
                      NumberUtils.parseOrThrow(resultPageNum),
                  )
                : this.userService.getByUsernames(usernames),
        );

        const items = list.pipe(
            flatMap(identity),
            filter(item => Boolean(item)),
            map(item =>
                ObjectUtils.DocumentToPlain(
                    item,
                    item.username === user.username ? UserDto : SimpleUserDto,
                ),
            ),
        );

        const length = from(
            this.userService.countDocumentsByUsernames(usernames),
        );

        return combineLatest(items.pipe(toArray()), length).pipe(
            map(([itemList, totalLength]) => ({
                items: itemList,
                length: totalLength,
                resultPageNum: NumberUtils.parseOr(resultPageNum, 1),
            })),
        );
    }

    @Put(':username')
    @UseGuards(UserGuard)
    @UseGuards(SelfGuard)
    @UseGuards(AuthGuard('jwt'))
    async edit(
        @Param('username') username: string,
        @Body() editUserDto: EditUserDto,
    ) {
        return from(this.userService.edit(username, editUserDto)).pipe(
            map(item => ObjectUtils.DocumentToPlain(item, UserDto)),
        );
    }

    @Delete(':username')
    @UseGuards(UserGuard)
    @UseGuards(SelfGuard)
    @UseGuards(AuthGuard('jwt'))
    async delete(@Param('username') username: string) {
        await this.userService.delete(username);
    }

    @Get(':username/avatar')
    @UseGuards(UserGuard)
    async getUserAvatar(
        @Res() res: Response,
        @Param('username') username: string,
    ) {
        const root = FileUtils.getRoot('cache/img/');
        const filename = await FileUtils.findFileInPathStartWith(
            `${username}.`,
            root,
        );

        if (filename) {
            return res.sendFile(FileUtils.normalize(root + '/' + filename));
        }

        const user = await this.userService.getByUsername(username);
        if (!user.avatar) {
            throw new NotFoundException('User avatar not found');
        }

        const img = parseDataURL(user.avatar);
        const createdFile = FileUtils.normalize(
            root + `${username}.${img.mimeType._subtype}`,
        );
        await FileUtils.mkdir(createdFile);
        await FileUtils.writeFile(createdFile, img.body);

        return res.sendFile(createdFile);
    }

    @Post(':username/avatar')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(UserGuard)
    @UseGuards(SelfGuard)
    @UseGuards(AuthGuard('jwt'))
    async uploadUserAvatar(
        @Body() aratarDto: UploadAratarDto,
        @Param('username') username: string,
    ) {
        const img = parseDataURL(aratarDto.dataUrl);
        if (!img) {
            throw new BadRequestException('Only accept data url');
        }
        if (img.mimeType._type !== 'image') {
            throw new BadRequestException('Only accept image data url');
        }

        const root = FileUtils.getRoot('cache/img/');
        const deleted = await FileUtils.findFileInPathStartWith(
            `${username}.`,
            root,
        );
        if (deleted) {
            FileUtils.deleteFile(FileUtils.normalize(root + '/' + deleted));
        }

        const filename = FileUtils.normalize(
            root + `${username}.${img.mimeType._subtype}`,
        );
        await FileUtils.mkdir(filename);
        await FileUtils.writeFile(filename, img.body);

        await this.userService.uploadUserAratar(username, aratarDto.dataUrl);
    }
}
