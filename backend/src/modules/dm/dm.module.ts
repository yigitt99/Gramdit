import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DmService } from './dm.service';
import { DmController } from './dm.controller';
import { DmConversation } from './entities/dm-conversation.entity';
import { DmConversationMember } from './entities/dm-conversation-member.entity';
import { DmMessage } from './entities/dm-message.entity';
import { User } from '../user/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { DmGateway } from './gateway/dm.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DmConversation,
      DmConversationMember,
      DmMessage,
      User,
    ]),
    AuthModule,
  ],
  controllers: [DmController],
  providers: [DmService, DmGateway],
  exports: [DmService, DmGateway],
})
export class DmModule {}
