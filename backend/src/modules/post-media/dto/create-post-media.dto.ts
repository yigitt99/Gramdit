import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { MediaType } from '../enums/media-type.enum';

export class CreatePostMediaDto {
  @IsString()
  @IsNotEmpty()
  mediaUrl: string;

  @IsEnum(MediaType)
  @IsNotEmpty()
  mediaType: MediaType;
}
