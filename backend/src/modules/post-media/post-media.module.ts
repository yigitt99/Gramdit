import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostMedia } from './entities/post-media.entity';
import { Post } from '../post/entities/post.entity';
import { PostMediaService } from './post-media.service';
import { PostMediaController } from './post-media.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostMedia, Post]),
    AuthModule,
  ],
  controllers: [PostMediaController],
  providers: [PostMediaService],
  exports: [PostMediaService],
})
export class PostMediaModule {}
