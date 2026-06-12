import { IsNotEmpty, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 10000)
  content: string;

  @IsUUID()
  @IsOptional()
  communityId?: string;
}
