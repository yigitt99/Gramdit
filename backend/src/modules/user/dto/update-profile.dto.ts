import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateProfileDto {
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
  avatarUrl?: string;
}
