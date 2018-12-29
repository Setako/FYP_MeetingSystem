import { arrayProp, prop, Ref, Typegoose } from 'typegoose';
import { User } from '../user/user.model';

export class Friend extends Typegoose {
    @arrayProp({
        required: true,
        itemsRef: User,
        unique: true,
        index: true,
    })
    public friends: Array<Ref<User>>;

    @prop({
        required: true,
    })
    public addDate: Date;

    @arrayProp({
        required: true,
        itemsRef: User,
    })
    public stared: Array<Ref<User>>;
}
