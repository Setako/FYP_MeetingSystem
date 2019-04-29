import { prop, Typegoose } from 'typegoose';

export class Device extends Typegoose {
    @prop({
        required: true,
    })
    public secret!: string;
}
