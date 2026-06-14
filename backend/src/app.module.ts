import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { validateEnv } from './config/env.validation';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { CommunityModule } from './modules/community/community.module';
import { PostModule } from './modules/post/post.module';
import { PostMediaModule } from './modules/post-media/post-media.module';
import { CommentModule } from './modules/comment/comment.module';
import { ReactionModule } from './modules/reaction/reaction.module';
import { FollowModule } from './modules/follow/follow.module';
import { NotificationModule } from './modules/notification/notification.module';
import { DmModule } from './modules/dm/dm.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    DatabaseModule,
    RedisModule,
    UserModule,
    AuthModule,
    CommunityModule,
    PostModule,
    PostMediaModule,
    CommentModule,
    ReactionModule,
    FollowModule,
    NotificationModule,
    DmModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
