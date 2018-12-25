import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType } from 'typegoose';
import { User } from './user.model';
import { CreateUserDto } from './dto/create-user.dto';
import uuidv4 from 'uuid/v4';
import { EditUserDto } from './dto/edit-user.dto';
import { UsernameUsedExistException } from '../../exception/auth/username-used-exist.exception';
import { EmailUsedExistException } from '../../exception/auth/email-used-exist.exception';

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User)
        private readonly userModel: typeof User & ModelType<User>,
    ) {}

    async getById(id: string) {
        return this.userModel.findById(id);
    }

    async getByUsername(username: string) {
        return this.userModel.findByUsername(username);
    }

    async getByUsernames(usernames: string[]) {
        return Promise.all(
            usernames.map(async username =>
                this.userModel.findByUsername(username),
            ),
        );
    }

    async getByUsernamesWithPage(
        usernames: string[],
        pageSize: number,
        pageNum = 1,
    ) {
        return this.userModel
            .find({
                username: {
                    $in: [usernames],
                },
            })
            .populate({
                path: 'friends',
                populate: {
                    path: 'friend',
                },
            })
            .skip(pageSize * (pageNum - 1))
            .limit(pageSize)
            .exec();
    }

    async countDocumentsByUsernames(usernames: string[]) {
        return this.userModel
            .find({
                username: {
                    $in: [usernames],
                },
            })
            .countDocuments()
            .exec();
    }

    async countDocuments() {
        return this.userModel
            .find()
            .countDocuments()
            .exec();
    }

    async getAll() {
        return this.userModel.find().exec();
    }

    async getAllWithPage(pageSize: number, pageNum = 1) {
        return this.userModel
            .find()
            .skip(pageSize * (pageNum - 1))
            .limit(pageSize)
            .exec();
    }

    findAll(options = {}) {
        return this.userModel.find(options);
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

        if (editUserDto.password) {
            edited.password = this.userModel.encryptPassword(
                editUserDto.password,
                edited.salt,
            );
        }

        edited.email = editUserDto.email || edited.email;
        edited.displayName = editUserDto.displayName || edited.displayName;
        edited.googleAccessToken =
            editUserDto.googleAccessToken || edited.googleAccessToken;
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

    async delete(username: string) {
        const deleted = await this.userModel.findByUsername(username);
        return deleted.remove();
    }

    async uploadUserAratar(username: string, dataUrl: string) {
        const updated = await this.userModel.findByUsername(username);
        updated.avatar = dataUrl;
        return updated.save();
    }
}
