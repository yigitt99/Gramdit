import { Injectable, ConflictException, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Post } from './entities/post.entity';
import { SavedPost } from './entities/saved-post.entity';
import { Community } from '../community/entities/community.entity';
import { CommunityMember } from '../community/entities/community-member.entity';
import { User } from '../user/entities/user.entity';
import { CommunityBan } from '../community/entities/community-ban.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { CommunityRole } from '../community/enums/community-role.enum';
import { Repost } from './entities/repost.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(SavedPost)
    private readonly savedPostRepository: Repository<SavedPost>,
    @InjectRepository(Community)
    private readonly communityRepository: Repository<Community>,
    @InjectRepository(CommunityMember)
    private readonly communityMemberRepository: Repository<CommunityMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(CommunityBan)
    private readonly communityBanRepository: Repository<CommunityBan>,
    @InjectRepository(Repost)
    private readonly repostRepository: Repository<Repost>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async create(createPostDto: CreatePostDto, authorId: string): Promise<Post> {
    const { content, communityId } = createPostDto;

    const author = await this.userRepository.findOne({ where: { id: authorId } });
    if (!author) {
      throw new NotFoundException('Author user not found');
    }

    let community: Community | null = null;

    if (communityId) {
      community = await this.communityRepository.findOne({ where: { id: communityId } });
      if (!community) {
        throw new NotFoundException('Community not found');
      }

      // Check if user is banned from this community
      const isBanned = await this.communityBanRepository.findOne({
        where: { communityId, userId: authorId },
      });
      if (isBanned) {
        throw new ForbiddenException('You are banned from posting in this community');
      }

      // Check if user is a member of the community
      const isMember = await this.communityMemberRepository.findOne({
        where: { communityId, userId: authorId },
      });
      if (!isMember) {
        throw new ForbiddenException('You must be a member of this community to post here');
      }
    }

    const post = this.postRepository.create({
      content,
      author,
      community,
      communityId: communityId || null,
      authorId,
    });

    const saved = await this.postRepository.save(post);

    // Filter out password hash from response
    delete (saved.author as any).passwordHash;

    return saved;
  }

  private extractUserId(req: any): string | null {
    try {
      const authHeader = req?.headers?.authorization;
      if (!authHeader) return null;
      const [type, token] = authHeader.split(' ');
      if (type !== 'Bearer' || !token) return null;

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      return payload?.sub || null;
    } catch {
      return null;
    }
  }

  async findAll(req?: any): Promise<Post[]> {
    const userId = this.extractUserId(req);

    const queryBuilder = this.postRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.community', 'community')
      .leftJoinAndSelect('post.media', 'media')
      .leftJoinAndSelect('post.reactions', 'reactions')
      .leftJoinAndSelect('post.savedPosts', 'savedPosts')
      .leftJoinAndSelect('post.reposts', 'reposts')
      .select([
        'post.id', 'post.content', 'post.communityId', 'post.commentCount', 'post.reactionCount', 'post.repostCount', 'post.createdAt', 'post.updatedAt',
        'author.id', 'author.username', 'author.fullName', 'author.avatarUrl',
        'community.id', 'community.name', 'community.slug', 'community.isPrivate',
        'media.id', 'media.mediaUrl', 'media.mediaType', 'media.createdAt',
        'reactions.id', 'reactions.userId', 'reactions.reactionType',
        'savedPosts.id', 'savedPosts.userId',
        'reposts.id', 'reposts.userId'
      ]);

    if (userId) {
      const userJoinedCommunities = await this.communityMemberRepository.find({
        where: { userId },
        select: ['communityId'],
      });
      const joinedCommunityIds = userJoinedCommunities.map(m => m.communityId);

      if (joinedCommunityIds.length > 0) {
        queryBuilder.where(
          'post.communityId IS NULL OR community.is_private = :isPrivateFalse OR post.communityId IN (:...joinedIds)',
          { isPrivateFalse: false, joinedIds: joinedCommunityIds }
        );
      } else {
        queryBuilder.where(
          'post.communityId IS NULL OR community.is_private = :isPrivateFalse',
          { isPrivateFalse: false }
        );
      }
    } else {
      queryBuilder.where(
        'post.communityId IS NULL OR community.is_private = :isPrivateFalse',
        { isPrivateFalse: false }
      );
    }

    queryBuilder.orderBy('post.createdAt', 'DESC');
    return queryBuilder.getMany();
  }

  async findById(id: string, req?: any): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: { author: true, community: true, media: true, reactions: true, savedPosts: true, reposts: true },
      select: {
        id: true,
        content: true,
        communityId: true,
        commentCount: true,
        reactionCount: true,
        repostCount: true,
        createdAt: true,
        updatedAt: true,
        author: {
          id: true,
          username: true,
          fullName: true,
          avatarUrl: true,
        },
        community: {
          id: true,
          name: true,
          slug: true,
          isPrivate: true,
        },
        media: {
          id: true,
          mediaUrl: true,
          mediaType: true,
          createdAt: true,
        },
        reactions: {
          id: true,
          userId: true,
          reactionType: true,
        },
        savedPosts: {
          id: true,
          userId: true,
        },
        reposts: {
          id: true,
          userId: true,
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }

    if (post.community && post.community.isPrivate) {
      const userId = this.extractUserId(req);
      if (!userId) {
        throw new ForbiddenException('You must be a member of this private community to view this post');
      }

      const isMember = await this.communityMemberRepository.findOne({
        where: { communityId: post.community.id, userId },
      });
      if (!isMember) {
        throw new ForbiddenException('You must be a member of this private community to view this post');
      }
    }

    return post;
  }

  async findCommunityPosts(slug: string, req?: any): Promise<Post[]> {
    const community = await this.communityRepository.findOne({ where: { slug } });
    if (!community) {
      throw new NotFoundException(`Community with slug "${slug}" not found`);
    }

    if (community.isPrivate) {
      const userId = this.extractUserId(req);
      if (!userId) {
        throw new ForbiddenException('You must be a member of this private community to view posts');
      }

      const isMember = await this.communityMemberRepository.findOne({
        where: { communityId: community.id, userId },
      });
      if (!isMember) {
        throw new ForbiddenException('You must be a member of this private community to view posts');
      }
    }

    return this.postRepository.find({
      where: { communityId: community.id },
      relations: { author: true, community: true, media: true, reactions: true, savedPosts: true, reposts: true },
      select: {
        id: true,
        content: true,
        communityId: true,
        commentCount: true,
        reactionCount: true,
        repostCount: true,
        createdAt: true,
        updatedAt: true,
        author: {
          id: true,
          username: true,
          fullName: true,
          avatarUrl: true,
        },
        community: {
          id: true,
          name: true,
          slug: true,
          isPrivate: true,
        },
        media: {
          id: true,
          mediaUrl: true,
          mediaType: true,
          createdAt: true,
        },
        reactions: {
          id: true,
          userId: true,
          reactionType: true,
        },
        savedPosts: {
          id: true,
          userId: true,
        },
        reposts: {
          id: true,
          userId: true,
        },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const post = await this.postRepository.findOne({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId === userId) {
      await this.postRepository.remove(post);
      return;
    }

    if (post.communityId) {
      const member = await this.communityMemberRepository.findOne({
        where: { communityId: post.communityId, userId },
      });

      if (member && (member.role === CommunityRole.FOUNDER || member.role === CommunityRole.MODERATOR)) {
        await this.postRepository.remove(post);
        return;
      }
    }

    throw new ForbiddenException('You do not have permission to delete this post');
  }

  async savePost(postId: string, userId: string): Promise<SavedPost> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existing = await this.savedPostRepository.findOne({
      where: { userId, postId },
    });
    if (existing) {
      throw new ConflictException('Post is already saved');
    }

    const savedPost = this.savedPostRepository.create({
      userId,
      postId,
    });
    return this.savedPostRepository.save(savedPost);
  }

  async unsavePost(postId: string, userId: string): Promise<void> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existing = await this.savedPostRepository.findOne({
      where: { userId, postId },
    });
    if (!existing) {
      throw new NotFoundException('Saved post relation not found');
    }

    await this.savedPostRepository.remove(existing);
  }

  async getSavedPosts(userId: string): Promise<Post[]> {
    const queryBuilder = this.postRepository.createQueryBuilder('post')
      .innerJoin('post.savedPosts', 'userSaved')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.community', 'community')
      .leftJoinAndSelect('post.media', 'media')
      .leftJoinAndSelect('post.reactions', 'reactions')
      .leftJoinAndSelect('post.savedPosts', 'savedPosts')
      .leftJoinAndSelect('post.reposts', 'reposts')
      .where('userSaved.userId = :userId', { userId })
      .select([
        'post.id', 'post.content', 'post.communityId', 'post.commentCount', 'post.reactionCount', 'post.repostCount', 'post.createdAt', 'post.updatedAt',
        'author.id', 'author.username', 'author.fullName', 'author.avatarUrl',
        'community.id', 'community.name', 'community.slug', 'community.isPrivate',
        'media.id', 'media.mediaUrl', 'media.mediaType', 'media.createdAt',
        'reactions.id', 'reactions.userId', 'reactions.reactionType',
        'savedPosts.id', 'savedPosts.userId',
        'reposts.id', 'reposts.userId'
      ])
      .orderBy('userSaved.createdAt', 'DESC');

    return queryBuilder.getMany();
  }

  async repost(postId: string, userId: string): Promise<Repost> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existing = await this.repostRepository.findOne({
      where: { userId, postId },
    });
    if (existing) {
      throw new ConflictException('You have already reposted this post');
    }

    const repost = this.repostRepository.create({
      userId,
      postId,
    });

    const savedRepost = await this.repostRepository.save(repost);
    
    post.repostCount += 1;
    await this.postRepository.save(post);

    return savedRepost;
  }

  async unrepost(postId: string, userId: string): Promise<void> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existing = await this.repostRepository.findOne({
      where: { userId, postId },
    });
    if (!existing) {
      throw new NotFoundException('Repost not found');
    }

    await this.repostRepository.remove(existing);

    post.repostCount = Math.max(0, post.repostCount - 1);
    await this.postRepository.save(post);
  }

  async getRepostsForPost(postId: string): Promise<any[]> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const reposts = await this.repostRepository.find({
      where: { postId },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });

    return reposts.map((r) => ({
      userId: r.user.id,
      username: r.user.username,
      avatarUrl: r.user.avatarUrl,
      createdAt: r.createdAt,
    }));
  }

  async getUserReposts(username: string): Promise<Post[]> {
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const queryBuilder = this.postRepository.createQueryBuilder('post')
      .innerJoin('post.reposts', 'userRepost')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.community', 'community')
      .leftJoinAndSelect('post.media', 'media')
      .leftJoinAndSelect('post.reactions', 'reactions')
      .leftJoinAndSelect('post.savedPosts', 'savedPosts')
      .leftJoinAndSelect('post.reposts', 'reposts')
      .where('userRepost.userId = :userId', { userId: user.id })
      .select([
        'post.id', 'post.content', 'post.communityId', 'post.commentCount', 'post.reactionCount', 'post.repostCount', 'post.createdAt', 'post.updatedAt',
        'author.id', 'author.username', 'author.fullName', 'author.avatarUrl',
        'community.id', 'community.name', 'community.slug', 'community.isPrivate',
        'media.id', 'media.mediaUrl', 'media.mediaType', 'media.createdAt',
        'reactions.id', 'reactions.userId', 'reactions.reactionType',
        'savedPosts.id', 'savedPosts.userId',
        'reposts.id', 'reposts.userId'
      ])
      .orderBy('userRepost.createdAt', 'DESC');

    return queryBuilder.getMany();
  }
}
