import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { Post } from '../post/entities/post.entity';
import { CommunityMember } from '../community/entities/community-member.entity';
import { CommunityBan } from '../community/entities/community-ban.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/enums/notification-type.enum';
import { CommunityRole } from '../community/enums/community-role.enum';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(CommunityMember)
    private readonly communityMemberRepository: Repository<CommunityMember>,
    @InjectRepository(CommunityBan)
    private readonly communityBanRepository: Repository<CommunityBan>,
    private readonly notificationService: NotificationService,
  ) {}

  async create(postId: string, createCommentDto: CreateCommentDto, authorId: string): Promise<Comment> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post with ID "${postId}" not found`);
    }

    if (post.communityId) {
      const isBanned = await this.communityBanRepository.findOne({
        where: { communityId: post.communityId, userId: authorId },
      });
      if (isBanned) {
        throw new ForbiddenException('You are banned from commenting in this community');
      }
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

    // Bildirim oluştur
    if (parentComment) {
      // Yorum yanıtı → parent yorumun yazarına COMMENT_REPLY bildirimi
      await this.notificationService.create({
        recipientId: parentComment.authorId,
        senderId: authorId,
        type: NotificationType.COMMENT_REPLY,
        referenceId: postId,
      });
    } else {
      // Normal yorum → post yazarına COMMENT bildirimi
      await this.notificationService.create({
        recipientId: post.authorId,
        senderId: authorId,
        type: NotificationType.COMMENT,
        referenceId: postId,
      });
    }

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

  async delete(id: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: { post: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId === userId || comment.post.authorId === userId) {
      await this.commentRepository.remove(comment);
      await this.postRepository.decrement({ id: comment.postId }, 'commentCount', 1);
      return;
    }

    if (comment.post.communityId) {
      const member = await this.communityMemberRepository.findOne({
        where: { communityId: comment.post.communityId, userId },
      });

      if (member && (member.role === CommunityRole.FOUNDER || member.role === CommunityRole.MODERATOR)) {
        await this.commentRepository.remove(comment);
        await this.postRepository.decrement({ id: comment.postId }, 'commentCount', 1);
        return;
      }
    }

    throw new ForbiddenException('You do not have permission to delete this comment');
  }
}
