import { IsNumberString, IsOptional } from 'class-validator';

export class GetFirendQueryDto {
    @IsOptional()
    @IsNumberString()
    readonly resultPageNum: string;

    @IsOptional()
    @IsNumberString()
    readonly resultPageSize: string;
}
