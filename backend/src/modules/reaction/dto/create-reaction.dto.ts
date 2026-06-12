import { IsEnum, IsNotEmpty } from 'class-validator';
   import { ReactionType } from '../enums/reaction-type.enum';

   export class CreateReactionDto {
     @IsEnum(ReactionType)
     @IsNotEmpty()
     reactionType: ReactionType;
   }
