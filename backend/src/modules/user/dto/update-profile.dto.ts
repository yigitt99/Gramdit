import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @Length(3, 30)
  @Matches(/^[a-zA-Z0-9_.]+$/, { message: 'Kullanıcı adı sadece harf, rakam, alt tire (_) ve nokta (.) içerebilir.' })
  username?: string;

  @IsString()
  @IsOptional()
  @Length(1, 100)
  fullName?: string;

  @IsString()
  @IsOptional()
  @Length(0, 500)
  bio?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  website?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  bannerUrl?: string;

  @IsOptional()
  isPrivate?: boolean;
}
