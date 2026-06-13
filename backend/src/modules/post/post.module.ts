import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { SavedPost } from './entities/saved-post.entity';
import { Community } from '../community/entities/community.entity';
import { CommunityMember } from '../community/entities/community-member.entity';
import { User } from '../user/entities/user.entity';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { CommunityBan } from '../community/entities/community-ban.entity';
import { AuthModule } from '../auth/auth.module';
import { Repost } from './entities/repost.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, SavedPost, Community, CommunityMember, User, CommunityBan, Repost]),
    AuthModule,
  ],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
