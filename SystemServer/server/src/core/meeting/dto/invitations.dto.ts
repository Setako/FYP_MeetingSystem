import { IsArray, IsEmail } from 'class-validator';

export class InvitationsDto {
    @IsArray()
    readonly friends!: string[];

    @IsArray()
    @IsEmail(
        {},
        {
            each: true,
        },
    )
    readonly emails!: string[];
}
