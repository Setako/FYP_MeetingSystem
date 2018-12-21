import { IsArray } from 'class-validator';

export class InvitationsDto {
    @IsArray()
    readonly friends: string[];

    @IsArray()
    readonly emails: string[];
}
