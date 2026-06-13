import { IsString, IsOptional, IsHexColor, MaxLength, Length } from 'class-validator';

export class UpdateCommunityDto {
  @IsString()
  @IsOptional()
  @Length(3, 50)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  bannerUrl?: string;

  @IsString()
  @IsOptional()
  @IsHexColor()
  themeColor?: string;
}
