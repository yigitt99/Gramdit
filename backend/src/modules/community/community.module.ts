import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Community } from './entities/community.entity';
import { CommunityMember } from './entities/community-member.entity';
import { User } from '../user/entities/user.entity';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';
import { CommunityBan } from './entities/community-ban.entity';
import { AuthModule } from '../auth/auth.module';
import { Notification } from '../notification/entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Community, CommunityMember, User, CommunityBan, Notification]),
    AuthModule,
  ],
  controllers: [CommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
