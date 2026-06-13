import { IsBoolean, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateCommunityDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  @Matches(/^[a-zA-Z0-9_ğüşöçıİĞÜŞÖÇ\s\-\'\’]+$/, {
    message: 'Name can only contain letters, numbers, spaces, underscores, hyphens, and apostrophes',
  })
  name: string;

  @IsString()
  @IsOptional()
  @Length(1, 1000)
  description?: string;

  @IsString()
  @IsOptional()
  @Length(1, 500)
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  @Length(1, 500)
  bannerUrl?: string;

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;

  @IsString()
  @IsOptional()
  @Length(7, 7)
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'themeColor must be a valid hex color code (e.g. #3F51B5)' })
  themeColor?: string;
}
