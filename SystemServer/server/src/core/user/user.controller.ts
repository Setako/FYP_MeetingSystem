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
import { UserGuard } from '../../guard/user.guard';
import { SplitSemicolonPipe } from '../../pipe/split-semicolon.pipe';
import { NumberUtils } from '../../utils/number.utils';
import { ObjectUtils } from '../../utils/object.utils';
import { CreateUserDto } from './dto/create-user.dto';
import { EditUserDto } from './dto/edit-user.dto';
import { GetUserDto } from './dto/get-user.dto';
import { UserService } from './user.service';

@Controller('user')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
    constructor(private readonly userService: UserService) {}

    @Get()
    async getAll(@Query() query) {
        const { resultPageNum = 1, resultPageSize } = query;

        const items = resultPageSize
            ? await this.userService.getAllWithPage(
                  NumberUtils.parseOrThrow(resultPageSize),
                  NumberUtils.parseOrThrow(resultPageNum),
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
    async create(@Body() user: CreateUserDto) {
        const created = await this.userService.create(user);
        return ObjectUtils.DocumentToPlain(created, GetUserDto);
    }

    @Put(':username')
    @UseGuards(UserGuard)
    async edit(
        @Param('username') username: string,
        @Body() editUserDto: EditUserDto,
    ) {
        const edited = await this.userService.edit(username, editUserDto);
        return ObjectUtils.DocumentToPlain(edited, GetUserDto);
    }

    @Delete(':username')
    @UseGuards(UserGuard)
    async delete(@Param('username') username: string) {
        await this.userService.delete(username);
    }
}
