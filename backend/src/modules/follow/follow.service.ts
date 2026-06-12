import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from './entities/follow.entity';
import { User } from '../user/entities/user.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/enums/notification-type.enum';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationService: NotificationService,
  ) {}

  /** Kullanıcıyı takip et */
  async follow(followingId: string, followerId: string): Promise<{ success: boolean; isFollowing: boolean }> {
    if (followerId === followingId) {
      throw new BadRequestException('Kendinizi takip edemezsiniz');
    }

    const targetUser = await this.userRepository.findOne({ where: { id: followingId } });
    if (!targetUser) {
      throw new NotFoundException('Takip edilecek kullanıcı bulunamadı');
    }

    const existing = await this.followRepository.findOne({
      where: { followerId, followingId },
    });

    if (existing) {
      throw new BadRequestException('Bu kullanıcıyı zaten takip ediyorsunuz');
    }

    const newFollow = this.followRepository.create({ followerId, followingId });
    await this.followRepository.save(newFollow);
    await this.updateCounts(followerId, followingId);

    // Bildirim oluştur (takip edilen kişiye)
    await this.notificationService.create({
      recipientId: followingId,
      senderId: followerId,
      type: NotificationType.FOLLOW,
    });

    return { success: true, isFollowing: true };
  }

  /** Takibi bırak */
  async unfollow(followingId: string, followerId: string): Promise<{ success: boolean; isFollowing: boolean }> {
    const targetUser = await this.userRepository.findOne({ where: { id: followingId } });
    if (!targetUser) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    const followRecord = await this.followRepository.findOne({
      where: { followerId, followingId },
    });

    if (!followRecord) {
      throw new BadRequestException('Bu kullanıcıyı takip etmiyorsunuz');
    }

    await this.followRepository.remove(followRecord);
    await this.updateCounts(followerId, followingId);

    return { success: true, isFollowing: false };
  }

  /** Takipçi listesi */
  async getFollowers(userId: string): Promise<any[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

    const list = await this.followRepository.find({
      where: { followingId: userId },
      relations: ['follower'],
    });

    return list.map(item => ({
      id: item.follower.id,
      username: item.follower.username,
      fullName: item.follower.fullName,
      avatarUrl: item.follower.avatarUrl,
      bio: item.follower.bio,
      followerCount: item.follower.followerCount,
      followingCount: item.follower.followingCount,
    }));
  }

  /** Takip edilenler listesi */
  async getFollowing(userId: string): Promise<any[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

    const list = await this.followRepository.find({
      where: { followerId: userId },
      relations: ['following'],
    });

    return list.map(item => ({
      id: item.following.id,
      username: item.following.username,
      fullName: item.following.fullName,
      avatarUrl: item.following.avatarUrl,
      bio: item.following.bio,
      followerCount: item.following.followerCount,
      followingCount: item.following.followingCount,
    }));
  }

  /** Takip durumu */
  async getFollowStatus(
    currentUserId: string,
    targetUserId: string,
  ): Promise<{ isFollowing: boolean; isFollowedBy: boolean }> {
    const [isFollowing, isFollowedBy] = await Promise.all([
      this.followRepository.findOne({
        where: { followerId: currentUserId, followingId: targetUserId },
      }),
      this.followRepository.findOne({
        where: { followerId: targetUserId, followingId: currentUserId },
      }),
    ]);

    return {
      isFollowing: !!isFollowing,
      isFollowedBy: !!isFollowedBy,
    };
  }

  private async updateCounts(followerId: string, followingId: string) {
    const [followerCount, followingCount] = await Promise.all([
      this.followRepository.count({ where: { followingId } }),
      this.followRepository.count({ where: { followerId } }),
    ]);

    await Promise.all([
      this.userRepository.update(followingId, { followerCount }),
      this.userRepository.update(followerId, { followingCount }),
    ]);
  }
}
