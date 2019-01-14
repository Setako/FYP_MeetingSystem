import { IsOptional, IsNumberString } from 'class-validator';

export class PaginationQueryDto {
    @IsOptional()
    @IsNumberString()
    readonly resultPageNum: string;

    @IsOptional()
    @IsNumberString()
    readonly resultPageSize: string;
}
