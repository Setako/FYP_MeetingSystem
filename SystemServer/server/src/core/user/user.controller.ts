import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Put,
    Query,
    UseGuards,
    NotFoundException,
    Header,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserGuard } from '../../guard/user.guard';
import { SplitSemicolonPipe } from '../../pipe/split-semicolon.pipe';
import { FileUtils } from '../../utils/file.utils';
import { NumberUtils } from '../../utils/number.utils';
import { ObjectUtils } from '../../utils/object.utils';
import { CreateUserDto } from './dto/create-user.dto';
import { EditUserDto } from './dto/edit-user.dto';
import { GetUserDto } from './dto/get-user.dto';
import { UploadAratarDto } from './dto/upload-aratar.dto';
import { UserService } from './user.service';
import parseDataURL = require('data-urls');

@Controller('user')
export class UsersController {
    constructor(private readonly userService: UserService) {}

    @Get()
    @UseGuards(AuthGuard('jwt'))
    async getAll(@Query() query) {
        const { resultPageNum, resultPageSize } = query;

        const items = resultPageSize
            ? await this.userService.getAllWithPage(
                  NumberUtils.parseOrThrow(resultPageSize),
                  NumberUtils.parseOr(resultPageNum, 1),
              )
            : await this.userService.getAll();

        const length = await this.userService.countDocuments();

        return {
            items: items.map(val =>
                ObjectUtils.DocumentToPlain(val, GetUserDto),
            ),
            resultPageNum,
            length,
        };
    }

    @Get(':usernames')
    @UseGuards(AuthGuard('jwt'))
    async get(
        @Param('usernames', new SplitSemicolonPipe()) usernames: string[],
        @Query() query,
    ) {
        const { resultPageNum = 1, resultPageSize } = query;

        const items = resultPageSize
            ? await this.userService.getByUsernamesWithPage(
                  usernames,
                  NumberUtils.parseOrThrow(resultPageSize),
                  NumberUtils.parseOrThrow(resultPageNum),
              )
            : await this.userService.getByUsernames(usernames);

        const length = await this.userService.countDocumentsByUsernames(
            usernames,
        );

        return {
            items: items
                .filter(Boolean)
                .map(val => ObjectUtils.DocumentToPlain(val, GetUserDto)),
            resultPageNum,
            length,
        };
    }

    @Post()
    @UseGuards(AuthGuard('jwt'))
    async create(@Body() user: CreateUserDto) {
        const created = await this.userService.create(user);
        return ObjectUtils.DocumentToPlain(created, GetUserDto);
    }

    @Put(':username')
    @UseGuards(AuthGuard('jwt'))
    @UseGuards(UserGuard)
    async edit(
        @Param('username') username: string,
        @Body() editUserDto: EditUserDto,
    ) {
        const edited = await this.userService.edit(username, editUserDto);
        return ObjectUtils.DocumentToPlain(edited, GetUserDto);
    }

    @Delete(':username')
    @UseGuards(AuthGuard('jwt'))
    @UseGuards(UserGuard)
    async delete(@Param('username') username: string) {
        await this.userService.delete(username);
    }

    @Get(':username/avatar')
    @Header('Content-Type', 'image')
    @UseGuards(UserGuard)
    async getUserAvatar(@Param('username') username: string) {
        const root = FileUtils.getRoot('cache/img/');
        const filename = await FileUtils.findFileInPathStartWith(
            `${username}.`,
            root,
        );

        if (filename) {
            return FileUtils.getFileBuffer(
                FileUtils.normalize(root + '/' + filename),
            );
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

        return img.body;
    }

    @Post(':username/avatar')
    @UseGuards(AuthGuard('jwt'))
    @UseGuards(UserGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
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
