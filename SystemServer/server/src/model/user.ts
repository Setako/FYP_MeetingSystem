import crypto from "crypto";
import {
    arrayProp,
    instanceMethod,
    ModelType,
    prop,
    Ref,
    staticMethod,
    Typegoose,
} from "typegoose";

export class Friend {
    public friend: Ref<User>;

    public addDate: Date;

    public started: boolean;

    constructor(friend: Ref<User>, addDate: Date, started: boolean) {
        this.friend = friend;
        this.addDate = addDate;
        this.started = started;
    }
}

export class Relation {
    public attendee: Ref<User>;

    public recordStartDate: Date;

    public latesMeetingDate: Date;

    public meetingCount: number;

    constructor(
        attendee: Ref<User>,
        recordStartDate: Date,
        latesMeetingDate: Date,
        meetingCount: number,
    ) {
        this.attendee = attendee;
        this.recordStartDate = recordStartDate;
        this.latesMeetingDate = latesMeetingDate;
        this.meetingCount = meetingCount;
    }
}

export class User extends Typegoose {
    @staticMethod
    public static async findByUsername(
        this: ModelType<User> & typeof User,
        username: string,
    ) {
        return await this.findOne({
            username,
        });
    }

    @staticMethod
    public static async isUsernameExist(
        this: ModelType<User> & typeof User,
        username: string,
    ) {
        return !!(await this.findByUsername(username));
    }

    @staticMethod
    public static async isEmailExist(
        this: ModelType<User> & typeof User,
        email: string,
    ) {
        return !!(await this.findOne({ email }));
    }

    @staticMethod
    public static encryptPassword(password: string, salt: string) {
        return crypto
            .createHash("md5")
            .update(password + salt)
            .digest("hex");
    }

    @prop({
        required: true,
        unique: true,
        index: true,
        maxlength: 20,
        minlength: 2,
    })
    public username: string;

    @prop({
        required: true,
        minlength: 8,
        maxlength: 60,
    })
    public password: string;

    @prop({
        required: true,
    })
    public salt: string;

    @prop({
        required: true,
        minlength: 2,
        maxlength: 20,
    })
    public displayName: string;

    @prop({
        required: true,
        unique: true,
    })
    public email: string;

    @prop({
        required: true,
    })
    public tokenVerificationCode: string;

    @prop()
    public googleAccessToken?: string;

    @arrayProp({
        items: Friend,
        default: [],
    })
    public friends: Friend[];

    @arrayProp({
        items: Relation,
        default: [],
    })
    public userMeetingRelation: Relation[];

    @instanceMethod
    public checkPassword(password: string) {
        return this.password === User.encryptPassword(password, this.salt);
    }
}

export const userModel = new User().getModelForClass(User);
