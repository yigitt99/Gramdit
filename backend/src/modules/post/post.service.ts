import { Injectable, ConflictException, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { Community } from '../community/entities/community.entity';
import { CommunityMember } from '../community/entities/community-member.entity';
import { User } from '../user/entities/user.entity';
import { CommunityBan } from '../community/entities/community-ban.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { CommunityRole } from '../community/enums/community-role.enum';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Community)
    private readonly communityRepository: Repository<Community>,
    @InjectRepository(CommunityMember)
    private readonly communityMemberRepository: Repository<CommunityMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(CommunityBan)
    private readonly communityBanRepository: Repository<CommunityBan>,
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

  async findAll(): Promise<Post[]> {
    return this.postRepository.find({
      relations: { author: true, community: true, media: true, reactions: true },
      select: {
        id: true,
        content: true,
        communityId: true,
        commentCount: true,
        reactionCount: true,
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
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: { author: true, community: true, media: true, reactions: true },
      select: {
        id: true,
        content: true,
        communityId: true,
        commentCount: true,
        reactionCount: true,
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
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }

    return post;
  }

  async findCommunityPosts(slug: string): Promise<Post[]> {
    const community = await this.communityRepository.findOne({ where: { slug } });
    if (!community) {
      throw new NotFoundException(`Community with slug "${slug}" not found`);
    }

    return this.postRepository.find({
      where: { communityId: community.id },
      relations: { author: true, community: true, media: true, reactions: true },
      select: {
        id: true,
        content: true,
        communityId: true,
        commentCount: true,
        reactionCount: true,
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
}
