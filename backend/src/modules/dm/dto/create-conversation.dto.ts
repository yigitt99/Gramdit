import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateConversationDto {
  @IsArray()
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  userIds: string[];
}
