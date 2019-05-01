import { Auth } from '@commander/shared/decorator/auth.decorator';
import { PaginationQueryDto } from '@commander/shared/dto/pagination-query.dto';
import { SelfGuard } from '@commander/shared/guard/self.guard';
import { UserGuard } from '@commander/shared/guard/user.guard';
import { documentToPlain } from '@commander/shared/operator/document';
import { skipFalsy } from '@commander/shared/operator/function';
import { FilterNotObjectIdStringPipe } from '@commander/shared/pipe/filter-not-object-id-string.pipe';
import { SplitSemicolonPipe } from '@commander/shared/pipe/split-semicolon.pipe';
import { UniqueArrayPipe } from '@commander/shared/pipe/unique-array.pipe';
import { FileInfo } from '@commander/shared/type/file-info.type';
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
    Param,
    Post,
    Put,
    Query,
    Res,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import parseDataURL from 'data-urls';
import { Response } from 'express';
import { Types } from 'mongoose';
import { combineLatest, from, of, empty } from 'rxjs';
import { filter, flatMap, map, tap, toArray, catchError } from 'rxjs/operators';
import { InstanceType } from 'typegoose';
import uuidv4 from 'uuid/v4';
import { GoogleCloudStorageService } from '../google/google-cloud-storage.service';
import { EditUserDto } from './dto/edit-user.dto';
import { SimpleUserDto } from './dto/simple-user.dto';
import { UploadAratarDto } from './dto/upload-aratar.dto';
import { UserDto } from './dto/user.dto';
import { FaceStatus } from './face.model';
import { FaceService } from './face.service';
import { User } from './user.model';
import { UserService } from './user.service';
import sharp from 'sharp';

@Controller('user')
export class UsersController {
    private DEFAULT_USER_AVATAR: string;

    constructor(
        private readonly userService: UserService,
        private readonly faceService: FaceService,
        private readonly googleCloudStorageService: GoogleCloudStorageService,
    ) {
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
        @Auth() user: InstanceType<User>,
        @Param('username') username: string,
        @Body() editUserDto: EditUserDto,
    ) {
        if (
            editUserDto.password &&
            !user.checkPassword(editUserDto.currentPassword)
        ) {
            throw new BadRequestException('Current password is incorrect');
        }

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
        const user = await this.userService.getByUsername(username).toPromise();
        return res.redirect(user.avatar || this.DEFAULT_USER_AVATAR);
    }

    @Post(':username/avatar')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(UserGuard)
    @UseGuards(SelfGuard)
    @UseGuards(AuthGuard('jwt'))
    async uploadUserAvatar(
        @Auth() user: InstanceType<User>,
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

        // save image
        const root = FileUtils.getRoot('cache/img/');
        const filename = FileUtils.normalize(
            root + `avatar-${username}.${img.mimeType._subtype}`,
        );
        await FileUtils.mkdir(filename);
        await FileUtils.writeFile(filename, img.body);

        // upload image
        const [file] = await this.googleCloudStorageService
            .upload(filename, {
                destination: `avatars/${user.id}`,
                validation: 'crc32c',
                metadata: {
                    cacheControl: 'public,no-cache',
                },
                gzip: true,
            })
            .toPromise();

        const link = await this.googleCloudStorageService
            .getFilePublicLink(file)
            .toPromise();

        // delete local
        await FileUtils.deleteFile(filename);

        // update data
        await this.userService.uploadUserAratar(username, link);
    }

    @Post(':username/faces')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(UserGuard)
    @UseGuards(SelfGuard)
    @UseGuards(AuthGuard('jwt'))
    @UseInterceptors(FilesInterceptor('faces'))
    uploadUserFace(
        @Auth() user: InstanceType<User>,
        @UploadedFiles() faces: FileInfo[],
    ) {
        const images = faces.filter(item => item.mimetype.startsWith('image/'));

        const compressed$ = from(images).pipe(
            flatMap(async item => {
                item.buffer = await sharp(item.buffer)
                    .withMetadata()
                    .resize(300)
                    .toBuffer();
                return item;
            }),
        );

        return compressed$.pipe(
            flatMap(async image => {
                await FileUtils.writeFile(
                    FileUtils.getRoot(`cache/img/faces-${image.originalname}`),
                    image.buffer,
                );
                return image;
            }),
            flatMap(image => {
                const name = uuidv4();
                return this.googleCloudStorageService
                    .upload(`cache/img/faces-${image.originalname}`, {
                        destination: `faces/${
                            user.id
                        }/${name}.${image.mimetype.split('/').pop()}`,
                        validation: 'crc32c',
                    })
                    .pipe(
                        tap(() =>
                            FileUtils.deleteFile(
                                FileUtils.getRoot(
                                    `cache/img/faces-${image.originalname}`,
                                ),
                            ),
                        ),
                        map(item => ({
                            name,
                            result: item,
                        })),
                    );
            }),
            flatMap(({ name, result }) =>
                this.faceService.create({
                    name,
                    imagePath: result[0].name,
                    owner: user,
                    status:
                        // waiting if size is small than 1MB otherwise invalid
                        Number((result[1] as any).size) * 0.000001 < 1
                            ? FaceStatus.Waiting
                            : FaceStatus.Invalid,
                }),
            ),
        );
    }

    @Get(':username/faces')
    @UseGuards(UserGuard)
    @UseGuards(SelfGuard)
    @UseGuards(AuthGuard('jwt'))
    getUserFace(@Auth() user: InstanceType<User>) {
        return this.faceService.getAllByUserId(user.id).pipe(
            flatMap(({ id, imagePath: imageName, status }) => {
                const timeout = new Date(Date.now() + 15 * 60000);
                return this.googleCloudStorageService
                    .getFileSignedLink({
                        name: imageName,
                        signCfg: {
                            action: 'read',
                            expires: timeout,
                        },
                    })
                    .pipe(map(([link]) => ({ id, status, link, timeout })));
            }),
            catchError(() => empty()),
            toArray(),
            map(items => ({ items, length: items.length })),
        );
    }

    @Delete(':username/faces/:ids')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(UserGuard)
    @UseGuards(SelfGuard)
    @UseGuards(AuthGuard('jwt'))
    deleteUserFace(
        @Auth() user: InstanceType<User>,
        @Param(
            'ids',
            new SplitSemicolonPipe(),
            new UniqueArrayPipe(),
            new FilterNotObjectIdStringPipe(),
        )
        ids: string,
    ) {
        return from(ids).pipe(
            flatMap(id => this.faceService.getByid(id)),
            filter(({ owner }) => Types.ObjectId(user.id).equals(owner as any)),
            tap(({ imagePath, resultPath }) =>
                [imagePath, resultPath].filter(Boolean).map(path => {
                    this.googleCloudStorageService.delete(path).subscribe();
                }),
            ),
            flatMap(({ id }) => this.faceService.delete(id)),
        );
    }
}
