import { ResourcesSharing } from '../meeting.model';
import { IsString, IsEnum } from 'class-validator';

export class GoogleDriveResourceDto {
    @IsString()
    resId: string;

    @IsEnum(ResourcesSharing)
    sharing: ResourcesSharing;
}
