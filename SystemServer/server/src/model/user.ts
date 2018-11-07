import crypto from "crypto";
import { arrayProp, instanceMethod, ModelType, prop, Ref, staticMethod, Typegoose } from "typegoose";

export class User extends Typegoose {

    @staticMethod
    public static async findByUsername(this: ModelType<User> & typeof User, username: string) {
        return await this.findOne({
            username,
        });
    }

    @staticMethod
    public static async isUsernameExist(this: ModelType<User> & typeof User, username: string) {
        return !!(await this.findByUsername(username));
    }

    @staticMethod
    public static encryptPassword(password: string, salt: string) {
        return crypto.createHash("md5").update(password + salt).digest("hex");
    }

    @prop({
        required: true,
        unique: true,
        index: true,
    })
    public username: string;

    @prop({
        required: true,
    })
    public password: string;

    @prop({
        required: true,
    })
    public salt: string;

    @prop()
    public displayName?: string;

    @prop()
    public email?: string;

    @arrayProp({
        itemsRef: User,
        required: true,
    })
    public recentMeetingUsers: Array<Ref<User>>;

    @arrayProp({
        itemsRef: User,
        required: true,
    })
    public friends: Array<Ref<User>>;

    @instanceMethod
    public checkPassword(password: string) {
        return this.password === User.encryptPassword(password, this.salt);
    }
}

export const userModel = new User().getModelForClass(User);
