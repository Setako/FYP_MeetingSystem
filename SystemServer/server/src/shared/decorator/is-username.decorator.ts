import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    Validator,
} from 'class-validator';

export function IsUsername(
    validationOptions: ValidationOptions = {
        message:
            '$property can only contain hyphens, underscores, letters, and numbers, and length between 2 and 20',
    },
) {
    return (object: object, propertyName: string) => {
        registerDecorator({
            name: 'isUsername',
            target: object.constructor,
            propertyName,
            constraints: [],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const validator = new Validator();
                    const isAlphanumeric = validator.isAlphanumeric.bind(
                        validator,
                    );

                    return (
                        typeof value === 'string' &&
                        value.length >= 2 &&
                        value.length <= 20 &&
                        !value
                            .split('')
                            .some(
                                char =>
                                    !(
                                        isAlphanumeric(char) ||
                                        char === '_' ||
                                        char === '-'
                                    ),
                            )
                    );
                },
            },
        });
    };
}
