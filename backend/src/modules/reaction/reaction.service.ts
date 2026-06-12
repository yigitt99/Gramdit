import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reaction } from './entities/reaction.entity';
import { Post } from '../post/entities/post.entity';
import { Comment } from '../comment/entities/comment.entity';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/enums/notification-type.enum';

@Injectable()
export class ReactionService {
  constructor(
    @InjectRepository(Reaction)
    private readonly reactionRepository: Repository<Reaction>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    private readonly notificationService: NotificationService,
  ) {}

  async handlePostReaction(postId: string, userId: string, dto: CreateReactionDto): Promise<Reaction | { toggledOff: boolean }> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post with ID "${postId}" not found`);
    }

    const existing = await this.reactionRepository.findOne({
      where: { userId, postId },
    });

    let result: Reaction | { toggledOff: boolean };
    let isNewReaction = false;

    if (existing) {
      if (existing.reactionType === dto.reactionType) {
        // Aynı reaksiyon tipi → kaldır (toggle off)
        await this.reactionRepository.remove(existing);
        result = { toggledOff: true };
      } else {
        // Farklı reaksiyon tipi → güncelle
        existing.reactionType = dto.reactionType;
        result = await this.reactionRepository.save(existing);
      }
    } else {
      // Yeni reaksiyon oluştur
      const newReaction = this.reactionRepository.create({
        userId,
        postId,
        commentId: null,
        reactionType: dto.reactionType,
      });
      result = await this.reactionRepository.save(newReaction);
      isNewReaction = true;
    }

    // reactionCount güncelle
    const count = await this.reactionRepository.count({ where: { postId } });
    await this.postRepository.update(postId, { reactionCount: count });

    // Yeni reaksiyon ise bildirim gönder (post yazarına)
    if (isNewReaction) {
      await this.notificationService.create({
        recipientId: post.authorId,
        senderId: userId,
        type: NotificationType.POST_REACTION,
        referenceId: postId,
      });
    }

    return result;
  }

  async handleCommentReaction(commentId: string, userId: string, dto: CreateReactionDto): Promise<Reaction | { toggledOff: boolean }> {
    const comment = await this.commentRepository.findOne({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException(`Comment with ID "${commentId}" not found`);
    }

    const existing = await this.reactionRepository.findOne({
      where: { userId, commentId },
    });

    let result: Reaction | { toggledOff: boolean };

    if (existing) {
      if (existing.reactionType === dto.reactionType) {
        await this.reactionRepository.remove(existing);
        result = { toggledOff: true };
      } else {
        existing.reactionType = dto.reactionType;
        result = await this.reactionRepository.save(existing);
      }
    } else {
      const newReaction = this.reactionRepository.create({
        userId,
        commentId,
        postId: null,
        reactionType: dto.reactionType,
      });
      result = await this.reactionRepository.save(newReaction);
    }

    // comment reactionCount güncelle
    const count = await this.reactionRepository.count({ where: { commentId } });
    await this.commentRepository.update(commentId, { reactionCount: count });

    return result;
  }

  async getPostReactions(postId: string): Promise<Reaction[]> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post with ID "${postId}" not found`);
    }

    return this.reactionRepository.find({
      where: { postId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getCommentReactions(commentId: string): Promise<Reaction[]> {
    const comment = await this.commentRepository.findOne({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException(`Comment with ID "${commentId}" not found`);
    }

    return this.reactionRepository.find({
      where: { commentId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }
}
