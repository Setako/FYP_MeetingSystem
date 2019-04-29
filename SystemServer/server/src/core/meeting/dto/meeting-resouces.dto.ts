import { IsArray, ValidateNested } from 'class-validator';
import { GoogleDriveResourceDto } from './googleDriveResource.dto';
import { Type } from 'class-transformer';

export class MeetingResourcesDto {
    @IsArray()
    @ValidateNested({
        each: true,
    })
    @Type(() => GoogleDriveResourceDto)
    googleDriveResources: GoogleDriveResourceDto[];
}
