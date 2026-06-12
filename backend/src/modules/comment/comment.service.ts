import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { Post } from '../post/entities/post.entity';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async create(postId: string, createCommentDto: CreateCommentDto, authorId: string): Promise<Comment> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post with ID "${postId}" not found`);
    }

    let parentComment: Comment | null = null;
    if (createCommentDto.parentCommentId) {
      parentComment = await this.commentRepository.findOne({
        where: { id: createCommentDto.parentCommentId },
      });
      if (!parentComment) {
        throw new NotFoundException(`Parent comment with ID "${createCommentDto.parentCommentId}" not found`);
      }
      if (parentComment.postId !== postId) {
        throw new BadRequestException('Parent comment does not belong to the same post');
      }
    }

    const comment = this.commentRepository.create({
      content: createCommentDto.content,
      postId,
      authorId,
      parentCommentId: createCommentDto.parentCommentId || null,
      parentComment,
      mediaUrl: createCommentDto.mediaUrl || null,
      mediaType: createCommentDto.mediaType || null,
    });

    const savedComment = await this.commentRepository.save(comment);

    // Increment comment count on the post
    await this.postRepository.increment({ id: postId }, 'commentCount', 1);

    // Fetch the saved comment with author relation populated for response
    return this.commentRepository.findOne({
      where: { id: savedComment.id },
      relations: { author: true },
      select: {
        id: true,
        content: true,
        postId: true,
        authorId: true,
        parentCommentId: true,
        mediaUrl: true,
        mediaType: true,
        createdAt: true,
        updatedAt: true,
        author: {
          id: true,
          username: true,
          fullName: true,
          avatarUrl: true,
        },
      },
    }) as Promise<Comment>;
  }

  async findByPostId(postId: string): Promise<Comment[]> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post with ID "${postId}" not found`);
    }

    // Fetch comments for this post.
    // To support nesting, we fetch root comments (parentCommentId is null)
    // and load replies recursively up to a reasonable level using relations.
    return this.commentRepository.find({
      where: { postId, parentCommentId: IsNull() },
      relations: [
        'author',
        'replies',
        'replies.author',
        'replies.replies',
        'replies.replies.author',
        'replies.replies.replies',
        'replies.replies.replies.author',
      ],
      select: {
        id: true,
        content: true,
        postId: true,
        authorId: true,
        parentCommentId: true,
        mediaUrl: true,
        mediaType: true,
        createdAt: true,
        updatedAt: true,
        author: {
          id: true,
          username: true,
          fullName: true,
          avatarUrl: true,
        },
        replies: {
          id: true,
          content: true,
          postId: true,
          authorId: true,
          parentCommentId: true,
          mediaUrl: true,
          mediaType: true,
          createdAt: true,
          updatedAt: true,
          author: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
          replies: {
            id: true,
            content: true,
            postId: true,
            authorId: true,
            parentCommentId: true,
            mediaUrl: true,
            mediaType: true,
            createdAt: true,
            updatedAt: true,
            author: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
            },
            replies: {
              id: true,
              content: true,
              postId: true,
              authorId: true,
              parentCommentId: true,
              mediaUrl: true,
              mediaType: true,
              createdAt: true,
              updatedAt: true,
              author: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async findById(id: string): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['author', 'parentComment', 'replies', 'replies.author'],
      select: {
        id: true,
        content: true,
        postId: true,
        authorId: true,
        parentCommentId: true,
        mediaUrl: true,
        mediaType: true,
        createdAt: true,
        updatedAt: true,
        author: {
          id: true,
          username: true,
          fullName: true,
          avatarUrl: true,
        },
        replies: {
          id: true,
          content: true,
          postId: true,
          authorId: true,
          parentCommentId: true,
          mediaUrl: true,
          mediaType: true,
          createdAt: true,
          updatedAt: true,
          author: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID "${id}" not found`);
    }

    return comment;
  }
}
