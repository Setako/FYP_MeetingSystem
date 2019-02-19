import { EmailUsedExistException } from '@commander/shared/exception/auth/email-used-exist.exception';
import { UsernameUsedExistException } from '@commander/shared/exception/auth/username-used-exist.exception';
import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType } from 'typegoose';
import uuidv4 from 'uuid/v4';
import { CreateUserDto } from './dto/create-user.dto';
import { EditUserDto } from './dto/edit-user.dto';
import { User } from './user.model';
import { from, of, empty, pipe, identity } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User)
        private readonly userModel: typeof User & ModelType<User>,
    ) {}

    getByEmail(email: string) {
        return of({ email }).pipe(
            flatMap(options => this.userModel.findOne(options).exec()),
        );
    }

    getById(id: string) {
        return of(id).pipe(
            flatMap(item => this.userModel.findById(item).exec()),
        );
    }

    getByUsername(username: string) {
        return of(username).pipe(
            flatMap(item => this.userModel.findByUsername(item)),
        );
    }

    getByUsernames(usernames: string[]) {
        return from(usernames).pipe(
            flatMap(username => this.userModel.findByUsername(username)),
        );
    }

    getByUsernamesWithPage(usernames: string[], pageSize: number, pageNum = 1) {
        return of({ username: { $in: usernames } }).pipe(
            flatMap(
                pipe(conditions =>
                    this.userModel
                        .find(conditions)
                        .skip(pageSize * (pageNum - 1))
                        .limit(pageSize)
                        .exec(),
                ),
            ),
            flatMap(identity),
        );
    }

    countDocumentsByUsernames(usernames: string[], options = {}) {
        return of({ ...options, username: { $in: usernames } }).pipe(
            flatMap(conditions =>
                this.userModel
                    .find(conditions)
                    .countDocuments()
                    .exec(),
            ),
        );
    }

    countDocuments(options = {}) {
        return of(options).pipe(
            flatMap(conditions =>
                this.userModel
                    .find(conditions)
                    .countDocuments()
                    .exec(),
            ),
        );
    }

    getAll(options = {}) {
        return of(options).pipe(
            flatMap(conditions => this.userModel.find(conditions).exec()),
            flatMap(identity),
        );
    }

    getAllWithPage(pageSize: number, pageNum = 1, options = {}) {
        return of(options).pipe(
            flatMap(conditions =>
                this.userModel
                    .find(conditions)
                    .skip(pageSize * (pageNum - 1))
                    .limit(pageSize)
                    .exec(),
            ),
            flatMap(identity),
        );
    }

    findAll(options = {}) {
        return of(options).pipe(
            map(conditions => this.userModel.find(conditions)),
        );
    }

    async create(createUserDto: CreateUserDto) {
        if (await this.userModel.isUsernameExist(createUserDto.username)) {
            throw new UsernameUsedExistException();
        }

        if (await this.userModel.isEmailExist(createUserDto.email)) {
            throw new EmailUsedExistException();
        }

        const salt = uuidv4();
        const tokenVerificationCode = uuidv4();

        const user = new this.userModel({
            ...createUserDto,
            password: this.userModel.encryptPassword(
                createUserDto.password,
                salt,
            ),
            salt,
            tokenVerificationCode,
            displayName: createUserDto.username,
        });

        return user.save();
    }

    async edit(username: string, editUserDto: EditUserDto) {
        const edited = await this.userModel.findByUsername(username);
        if (!edited) {
            return null;
        }

        if (editUserDto.password) {
            edited.password = this.userModel.encryptPassword(
                editUserDto.password,
                edited.salt,
            );
        }

        edited.email = editUserDto.email || edited.email;
        edited.displayName = editUserDto.displayName || edited.displayName;
        if (editUserDto.setting) {
            edited.setting = {
                ...edited.setting,
                markEventOnCalendarId:
                    editUserDto.setting.markEventOnCalendarId ||
                    edited.setting.markEventOnCalendarId,
                calendarImportance:
                    editUserDto.setting.calendarImportance ||
                    edited.setting.calendarImportance,
                notification:
                    editUserDto.setting.notification ||
                    edited.setting.notification,
            };
        }

        return edited.save();
    }

    async editGoogleRefreshToken(userId: string, refreshToken?: string) {
        return from(this.userModel.findById(userId).exec())
            .pipe(
                flatMap(item => (item ? of(item) : empty())),
                flatMap(item => {
                    item.googleRefreshToken = refreshToken;
                    return item.save();
                }),
            )
            .toPromise();
    }

    async delete(username: string) {
        return from(this.userModel.findByUsername(username))
            .pipe(
                flatMap(item => (item ? of(item) : empty())),
                flatMap(item => item.remove()),
            )
            .toPromise();
    }

    async uploadUserAratar(username: string, dataUrl: string) {
        return from(this.userModel.findByUsername(username))
            .pipe(
                flatMap(item => (item ? of(item) : empty())),
                flatMap(item => {
                    item.avatar = dataUrl;
                    return item.save();
                }),
            )
            .toPromise();
    }
}
