type FaceImageStatus = 'waiting' | 'trained' | 'invalid';

interface FaceImage {
  id: string;
  status: FaceImageStatus; // Enum: [waiting, trained, invalid]
  link: string;
  timeout: string;
}
