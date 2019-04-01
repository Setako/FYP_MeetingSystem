import { FaceDto } from './face.dto';

export class MergeResultDto {
    id: string;

    items: FaceDto[];

    modelPath: string;

    validOwner: {
        [key: string]: number;
    };
}
