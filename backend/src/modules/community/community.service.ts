import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Community } from './entities/community.entity';
import { CommunityMember } from './entities/community-member.entity';
import { User } from '../user/entities/user.entity';
import { CreateCommunityDto } from './dto/create-community.dto';
import { CommunityRole } from './enums/community-role.enum';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(Community)
    private readonly communityRepository: Repository<Community>,
    @InjectRepository(CommunityMember)
    private readonly communityMemberRepository: Repository<CommunityMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private slugify(text: string): string {
    const turkishChars: { [key: string]: string } = {
      'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
      'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
    };
    let slug = text.toString();
    for (const char in turkishChars) {
      slug = slug.replace(new RegExp(char, 'g'), turkishChars[char]);
    }
    return slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Remove duplicate hyphens
  }

  async create(createCommunityDto: CreateCommunityDto, creatorId: string): Promise<Community> {
    const { name, description, avatarUrl, bannerUrl, isPrivate } = createCommunityDto;

    // Check if community with same name exists
    const existingName = await this.communityRepository.findOne({ where: { name } });
    if (existingName) {
      throw new ConflictException('A community with this name already exists');
    }

    // Generate slug
    const slug = this.slugify(name);

    // Check if community with same slug exists
    const existingSlug = await this.communityRepository.findOne({ where: { slug } });
    if (existingSlug) {
      throw new ConflictException('A community with this slug already exists. Please choose a different name.');
    }

    // Find creator user
    const creator = await this.userRepository.findOne({ where: { id: creatorId } });
    if (!creator) {
      throw new NotFoundException('Creator user not found');
    }

    return this.communityRepository.manager.transaction(async (transactionalEntityManager) => {
      const community = transactionalEntityManager.create(Community, {
        name,
        slug,
        description: description || null,
        avatarUrl: avatarUrl || null,
        bannerUrl: bannerUrl || null,
        isPrivate: isPrivate ?? false,
        memberCount: 1, // Creator is automatically a member
        createdBy: creator,
      });

      const saved = await transactionalEntityManager.save(community);

      // Create community member entry for founder
      const member = transactionalEntityManager.create(CommunityMember, {
        communityId: saved.id,
        userId: creator.id,
        role: CommunityRole.FOUNDER,
      });

      await transactionalEntityManager.save(member);

      delete (saved.createdBy as any).passwordHash;
      return saved;
    });
  }

  async findAll(): Promise<Community[]> {
    return this.communityRepository.find({
      relations: { createdBy: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        avatarUrl: true,
        bannerUrl: true,
        isPrivate: true,
        memberCount: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          avatarUrl: true,
        },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findBySlug(slug: string): Promise<Community> {
    const community = await this.communityRepository.findOne({
      where: { slug },
      relations: { createdBy: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        avatarUrl: true,
        bannerUrl: true,
        isPrivate: true,
        memberCount: true,
        createdAt: true,
        createdBy: {
          id: true,
          username: true,
        },
      },
    });

    if (!community) {
      throw new NotFoundException(`Community with slug "${slug}" not found`);
    }

    return community;
  }

  async findMembers(communityId: string): Promise<CommunityMember[]> {
    const community = await this.communityRepository.findOne({ where: { id: communityId } });
    if (!community) {
      throw new NotFoundException(`Community with ID "${communityId}" not found`);
    }

    return this.communityMemberRepository.find({
      where: { communityId },
      relations: { user: true },
      select: {
        id: true,
        communityId: true,
        userId: true,
        role: true,
        joinedAt: true,
        user: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          avatarUrl: true,
        },
      },
      order: { joinedAt: 'ASC' },
    });
  }

  async findMember(communityId: string, userId: string): Promise<CommunityMember> {
    const community = await this.communityRepository.findOne({ where: { id: communityId } });
    if (!community) {
      throw new NotFoundException(`Community with ID "${communityId}" not found`);
    }

    const member = await this.communityMemberRepository.findOne({
      where: { communityId, userId },
      relations: { user: true },
      select: {
        id: true,
        communityId: true,
        userId: true,
        role: true,
        joinedAt: true,
        user: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          avatarUrl: true,
        },
      },
    });

    if (!member) {
      throw new NotFoundException(`User with ID "${userId}" is not a member of this community`);
    }

    return member;
  }
}
