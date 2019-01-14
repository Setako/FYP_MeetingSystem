import { IsBoolean } from 'class-validator';

export class AcceptDto {
    @IsBoolean()
    readonly accept!: boolean;
}
