import { IsNumber, IsOptional, IsNumberString } from 'class-validator';

export class GetFirendQueryDto {
    @IsOptional()
    @IsNumberString()
    readonly resultPageNum: string;

    @IsOptional()
    @IsNumberString()
    readonly resultPageSize: string;
}
