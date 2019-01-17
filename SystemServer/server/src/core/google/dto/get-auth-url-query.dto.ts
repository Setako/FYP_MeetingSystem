import { IsOptional, IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class GetAuthUrlQueryDto {
    @IsUrl()
    @IsNotEmpty()
    @IsString()
    @IsOptional()
    readonly successRedirect?: string;
}
