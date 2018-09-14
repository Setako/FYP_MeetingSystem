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
        return await this.findByUsername(username);
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

    @prop()
    public displayName?: string;

    @prop()
    public email?: string;

    @arrayProp({
        itemsRef: User,
    })
    public friend?: Array<Ref<User>>;

    @instanceMethod
    public async checkPassword(password: string) {
        return this.password === password;
    }
}

export const userModel = new User().getModelForClass(User);
