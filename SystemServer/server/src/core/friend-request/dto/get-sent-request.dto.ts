import { PaginationQueryDto } from '@commander/shared/dto/pagination-query.dto';
import { FriendRequestStatus } from '../friend-request.model';
import { IsEnum, IsOptional } from 'class-validator';

export class GetSentReqeustQuery extends PaginationQueryDto {
    @IsEnum(FriendRequestStatus, {
        each: true,
    })
    @IsOptional()
    readonly status?: FriendRequestStatus[];
}
