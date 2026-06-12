import { IsBoolean, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateCommunityDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  @Matches(/^[a-zA-Z0-9_\s\-]+$/, {
    message: 'Name can only contain letters, numbers, spaces, underscores, and hyphens',
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
}
