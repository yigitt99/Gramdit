import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostMedia } from './entities/post-media.entity';
import { Post } from '../post/entities/post.entity';
import { CreatePostMediaDto } from './dto/create-post-media.dto';

@Injectable()
export class PostMediaService {
  constructor(
    @InjectRepository(PostMedia)
    private readonly postMediaRepository: Repository<PostMedia>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async create(postId: string, createPostMediaDto: CreatePostMediaDto, userId: string): Promise<PostMedia> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post with ID "${postId}" not found`);
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only add media to your own posts');
    }

    const media = this.postMediaRepository.create({
      postId,
      mediaUrl: createPostMediaDto.mediaUrl,
      mediaType: createPostMediaDto.mediaType,
      post,
    });

    return this.postMediaRepository.save(media);
  }

  async findByPostId(postId: string): Promise<PostMedia[]> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post with ID "${postId}" not found`);
    }

    return this.postMediaRepository.find({
      where: { postId },
      order: { createdAt: 'ASC' },
    });
  }
}
