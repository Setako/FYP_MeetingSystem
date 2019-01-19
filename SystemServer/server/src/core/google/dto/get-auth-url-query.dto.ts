import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class GetAuthUrlQueryDto {
    @IsNotEmpty()
    @IsString()
    @IsOptional()
    readonly successRedirect?: string;
}
