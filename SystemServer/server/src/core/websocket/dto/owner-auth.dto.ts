import { IsString, IsMongoId } from 'class-validator';

export class OwnerAuthDto {
    @IsString()
    readonly authenticationToken: string;

    @IsMongoId()
    readonly meetingId: string;
}
