import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
} from 'class-validator';
import { NumberUtils } from '../utils/number.utils';

export function IsTimeString(
    validationOptions: ValidationOptions = {
        message:
            '$property should be a correct time string in the format hh:mm',
    },
) {
    return (object: object, propertyName: string) => {
        registerDecorator({
            name: 'isTimeString',
            target: object.constructor,
            propertyName,
            constraints: [],
            options: validationOptions,
            validator: {
                validate(value: any, _args: ValidationArguments) {
                    if (!(typeof value === 'string' && value.length === 5)) {
                        return false;
                    }

                    const list = value.split(':');

                    if (list.length !== 2) {
                        return false;
                    }

                    const hour = NumberUtils.parseOr(list[0], null);
                    const minutes = NumberUtils.parseOr(list[1], null);

                    if (hour === null || minutes === null) {
                        return false;
                    }

                    return (
                        hour >= 0 && hour <= 24 && minutes >= 0 && minutes <= 60
                    );
                },
            },
        });
    };
}
