import { Injectable, ConflictException, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Community } from './entities/community.entity';
import { CommunityMember } from './entities/community-member.entity';
import { User } from '../user/entities/user.entity';
import { CommunityBan } from './entities/community-ban.entity';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { CommunityRole } from './enums/community-role.enum';
import { Notification } from '../notification/entities/notification.entity';
import { NotificationType } from '../notification/enums/notification-type.enum';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(Community)
    private readonly communityRepository: Repository<Community>,
    @InjectRepository(CommunityMember)
    private readonly communityMemberRepository: Repository<CommunityMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(CommunityBan)
    private readonly communityBanRepository: Repository<CommunityBan>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
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
    const { name, description, avatarUrl, bannerUrl, isPrivate, themeColor } = createCommunityDto;

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
        themeColor: themeColor || '#3F51B5',
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
        themeColor: true,
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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    const community = await this.communityRepository.findOne({
      where: isUuid ? { id: slug } : { slug },
      relations: { createdBy: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        avatarUrl: true,
        bannerUrl: true,
        isPrivate: true,
        themeColor: true,
        memberCount: true,
        createdAt: true,
        createdBy: {
          id: true,
          username: true,
        },
      },
    });

    if (!community) {
      throw new NotFoundException(`Community with slug or id "${slug}" not found`);
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

  async isBanned(communityId: string, userId: string): Promise<boolean> {
    const ban = await this.communityBanRepository.findOne({
      where: { communityId, userId },
    });
    return !!ban;
  }

  async getBanDetails(communityId: string, userId: string): Promise<CommunityBan | null> {
    return this.communityBanRepository.findOne({
      where: { communityId, userId },
      relations: { bannedBy: true },
    });
  }


  async getBans(communityId: string, requesterId: string): Promise<CommunityBan[]> {
    const requester = await this.communityMemberRepository.findOne({
      where: { communityId, userId: requesterId },
    });

    if (!requester || (requester.role !== CommunityRole.FOUNDER && requester.role !== CommunityRole.MODERATOR)) {
      throw new ForbiddenException('You do not have permission to view bans in this community');
    }

    return this.communityBanRepository.find({
      where: { communityId },
      relations: { user: true, bannedBy: true },
      select: {
        id: true,
        communityId: true,
        userId: true,
        bannedById: true,
        reason: true,
        createdAt: true,
        user: {
          id: true,
          username: true,
          fullName: true,
          avatarUrl: true,
        },
        bannedBy: {
          id: true,
          username: true,
          fullName: true,
        },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async banUser(communityId: string, targetUserId: string, requesterId: string, reason?: string): Promise<CommunityBan> {
    if (targetUserId === requesterId) {
      throw new BadRequestException('You cannot ban yourself');
    }

    const requester = await this.communityMemberRepository.findOne({
      where: { communityId, userId: requesterId },
    });

    if (!requester || (requester.role !== CommunityRole.FOUNDER && requester.role !== CommunityRole.MODERATOR)) {
      throw new ForbiddenException('You do not have permission to ban users');
    }

    const targetMember = await this.communityMemberRepository.findOne({
      where: { communityId, userId: targetUserId },
    });

    if (targetMember) {
      if (targetMember.role === CommunityRole.FOUNDER) {
        throw new ForbiddenException('Founder cannot be banned');
      }
      if (requester.role === CommunityRole.MODERATOR && targetMember.role === CommunityRole.MODERATOR) {
        throw new ForbiddenException('Moderators cannot ban other moderators');
      }
    }

    const existingBan = await this.communityBanRepository.findOne({
      where: { communityId, userId: targetUserId },
    });
    if (existingBan) {
      throw new BadRequestException('User is already banned');
    }

    const result = await this.communityRepository.manager.transaction(async (transactionalEntityManager) => {
      const ban = transactionalEntityManager.create(CommunityBan, {
        communityId,
        userId: targetUserId,
        bannedById: requesterId,
        reason: reason || null,
      });

      const savedBan = await transactionalEntityManager.save(ban);

      if (targetMember) {
        await transactionalEntityManager.delete(CommunityMember, { id: targetMember.id });
        await transactionalEntityManager.decrement(Community, { id: communityId }, 'memberCount', 1);
      }

      const notif = transactionalEntityManager.create(Notification, {
        recipientId: targetUserId,
        senderId: requesterId,
        type: NotificationType.COMMUNITY_BAN,
        referenceId: communityId,
        isRead: false,
      });
      await transactionalEntityManager.save(Notification, notif);

      return savedBan;
    });
    return result;
  }

  async unbanUser(communityId: string, targetUserId: string, requesterId: string): Promise<void> {
    const requester = await this.communityMemberRepository.findOne({
      where: { communityId, userId: requesterId },
    });

    if (!requester || (requester.role !== CommunityRole.FOUNDER && requester.role !== CommunityRole.MODERATOR)) {
      throw new ForbiddenException('You do not have permission to unban users');
    }

    const ban = await this.communityBanRepository.findOne({
      where: { communityId, userId: targetUserId },
    });

    if (!ban) {
      throw new NotFoundException('Ban not found for this user');
    }

    await this.communityBanRepository.delete({ id: ban.id });
  }

  async updateMemberRole(communityId: string, targetUserId: string, requesterId: string, newRole: CommunityRole): Promise<CommunityMember> {
    const requester = await this.communityMemberRepository.findOne({
      where: { communityId, userId: requesterId },
    });

    if (!requester || requester.role !== CommunityRole.FOUNDER) {
      throw new ForbiddenException('Only the founder can manage member roles');
    }

    const targetMember = await this.communityMemberRepository.findOne({
      where: { communityId, userId: targetUserId },
      relations: { user: true },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found');
    }

    if (targetMember.role === CommunityRole.FOUNDER) {
      throw new BadRequestException('Cannot change founder role');
    }

    targetMember.role = newRole;
    return this.communityMemberRepository.save(targetMember);
  }

  async joinCommunity(communityId: string, userId: string): Promise<CommunityMember> {
    const community = await this.communityRepository.findOne({ where: { id: communityId } });
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    // Check if already a member
    const existing = await this.communityMemberRepository.findOne({
      where: { communityId, userId },
    });
    if (existing) {
      throw new ConflictException('Already a member of this community');
    }

    // Check if banned
    const banned = await this.communityBanRepository.findOne({
      where: { communityId, userId },
    });
    if (banned) {
      throw new ForbiddenException('You are banned from this community');
    }

    return this.communityRepository.manager.transaction(async (transactionalEntityManager) => {
      const member = transactionalEntityManager.create(CommunityMember, {
        communityId,
        userId,
        role: CommunityRole.MEMBER,
      });
      const saved = await transactionalEntityManager.save(member);
      await transactionalEntityManager.increment(Community, { id: communityId }, 'memberCount', 1);
      return saved;
    });
  }

  async leaveCommunity(communityId: string, userId: string): Promise<void> {
    const member = await this.communityMemberRepository.findOne({
      where: { communityId, userId },
    });

    if (!member) {
      throw new NotFoundException('You are not a member of this community');
    }

    if (member.role === CommunityRole.FOUNDER) {
      throw new ForbiddenException('Founders cannot leave their own community');
    }

    await this.communityRepository.manager.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.delete(CommunityMember, { id: member.id });
      await transactionalEntityManager.decrement(Community, { id: communityId }, 'memberCount', 1);
    });
  }

  async kickMember(communityId: string, targetUserId: string, requesterId: string): Promise<void> {
    if (targetUserId === requesterId) {
      throw new BadRequestException('You cannot kick yourself');
    }

    const requester = await this.communityMemberRepository.findOne({
      where: { communityId, userId: requesterId },
    });

    if (!requester || (requester.role !== CommunityRole.FOUNDER && requester.role !== CommunityRole.MODERATOR)) {
      throw new ForbiddenException('You do not have permission to kick members');
    }

    const targetMember = await this.communityMemberRepository.findOne({
      where: { communityId, userId: targetUserId },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found');
    }

    if (targetMember.role === CommunityRole.FOUNDER) {
      throw new ForbiddenException('Founder cannot be kicked');
    }

    if (requester.role === CommunityRole.MODERATOR && targetMember.role === CommunityRole.MODERATOR) {
      throw new ForbiddenException('Moderators cannot kick other moderators');
    }

    await this.communityRepository.manager.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.delete(CommunityMember, { id: targetMember.id });
      await transactionalEntityManager.decrement(Community, { id: communityId }, 'memberCount', 1);

      const notif = transactionalEntityManager.create(Notification, {
        recipientId: targetUserId,
        senderId: requesterId,
        type: NotificationType.COMMUNITY_KICK,
        referenceId: communityId,
        isRead: false,
      });
      await transactionalEntityManager.save(Notification, notif);
    });
  }

  async updateThemeColor(communityId: string, requesterId: string, themeColor: string | null): Promise<Community> {
    const requester = await this.communityMemberRepository.findOne({
      where: { communityId, userId: requesterId },
    });

    if (!requester || (requester.role !== CommunityRole.FOUNDER && requester.role !== CommunityRole.MODERATOR)) {
      throw new ForbiddenException('Only founders or moderators can manage community theme');
    }

    const community = await this.communityRepository.findOne({ where: { id: communityId } });
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    community.themeColor = themeColor;
    return this.communityRepository.save(community);
  }

  async update(id: string, requesterId: string, dto: UpdateCommunityDto): Promise<Community> {
    const member = await this.communityMemberRepository.findOne({
      where: { communityId: id, userId: requesterId },
    });

    if (!member || (member.role !== CommunityRole.FOUNDER && member.role !== CommunityRole.MODERATOR)) {
      throw new ForbiddenException('Only community founders or moderators can update community settings');
    }

    const community = await this.communityRepository.findOne({ where: { id } });
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    if (dto.name !== undefined) {
      const trimmedName = dto.name.trim();
      if (trimmedName && trimmedName !== community.name) {
        const existing = await this.communityRepository.findOne({ where: { name: trimmedName } });
        if (existing) {
          throw new ConflictException('Bu isimde bir topluluk zaten var');
        }
        community.name = trimmedName;
        community.slug = this.slugify(trimmedName);
      }
    }
    if (dto.description !== undefined) community.description = dto.description;
    if (dto.avatarUrl !== undefined) community.avatarUrl = dto.avatarUrl;
    if (dto.bannerUrl !== undefined) community.bannerUrl = dto.bannerUrl;
    if (dto.themeColor !== undefined) community.themeColor = dto.themeColor;

    return this.communityRepository.save(community);
  }
}
