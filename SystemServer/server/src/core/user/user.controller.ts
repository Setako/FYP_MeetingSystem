import { UserGuard } from '@commander/shared/guard/user.guard';
import { SplitSemicolonPipe } from '@commander/shared/pipe/split-semicolon.pipe';
import { FileUtils } from '@commander/shared/utils/file.utils';
import { NumberUtils } from '@commander/shared/utils/number.utils';
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
import { combineLatest, from, of } from 'rxjs';
import { map, toArray, flatMap } from 'rxjs/operators';
import { SimpleUserDto } from './dto/simple-user.dto';
import { Auth } from '@commander/shared/decorator/auth.decorator';
import { User } from './user.model';
import { InstanceType } from 'typegoose';
import { PaginationQueryDto } from '@commander/shared/dto/pagination-query.dto';
import { documentToPlain } from '@commander/shared/operator/document';
import { skipFalsy } from '@commander/shared/operator/function';

@Controller('user')
export class UsersController {
    private DEFAULT_USER_AVATAR: string;

    constructor(private readonly userService: UserService) {
        this.DEFAULT_USER_AVATAR = process.env.DEFAULT_USER_AVATAR;
    }

    @Get()
    @UseGuards(AuthGuard('jwt'))
    getAll(@Query()
    {
        resultPageNum,
        resultPageSize,
    }: PaginationQueryDto) {
        const user$ = resultPageSize
            ? this.userService.getAllWithPage(
                  NumberUtils.parseOrThrow(resultPageSize),
                  NumberUtils.parseOr(resultPageNum, 1),
              )
            : this.userService.getAll();

        const items = user$.pipe(
            documentToPlain(SimpleUserDto),
            toArray(),
        );

        const length = this.userService.countDocuments();

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
    get(
        @Auth() user: InstanceType<User>,
        @Param('usernames', new SplitSemicolonPipe()) usernames: string[],
        @Query() { resultPageNum = '1', resultPageSize }: PaginationQueryDto,
    ) {
        const user$ = resultPageSize
            ? this.userService.getByUsernamesWithPage(
                  usernames,
                  NumberUtils.parseOrThrow(resultPageSize),
                  NumberUtils.parseOrThrow(resultPageNum),
              )
            : this.userService.getByUsernames(usernames);

        const items = user$.pipe(
            skipFalsy(),
            flatMap(item =>
                of(item).pipe(
                    documentToPlain(
                        item.username === user.username
                            ? UserDto
                            : SimpleUserDto,
                    ),
                ),
            ),
            toArray(),
        );

        const length = this.userService.countDocumentsByUsernames(usernames);

        return combineLatest(items, length).pipe(
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
    edit(
        @Param('username') username: string,
        @Body() editUserDto: EditUserDto,
    ) {
        return from(this.userService.edit(username, editUserDto)).pipe(
            documentToPlain(UserDto),
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

        const user = await this.userService.getByUsername(username).toPromise();
        if (!user.avatar) {
            if (this.DEFAULT_USER_AVATAR) {
                const defaultAvatar = parseDataURL(this.DEFAULT_USER_AVATAR);
                res.contentType(defaultAvatar.mimeType.toString());
                return res.end(defaultAvatar.body, 'binary');
            }
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
