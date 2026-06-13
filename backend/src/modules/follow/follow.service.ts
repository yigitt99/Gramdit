import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from './entities/follow.entity';
import { FollowRequest } from './entities/follow-request.entity';
import { User } from '../user/entities/user.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/enums/notification-type.enum';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
    @InjectRepository(FollowRequest)
    private readonly followRequestRepository: Repository<FollowRequest>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationService: NotificationService,
  ) {}

  /** Kullanıcıyı takip et veya istek gönder */
  async follow(followingId: string, followerId: string): Promise<{ success: boolean; isFollowing: boolean; isRequestSent: boolean }> {
    if (followerId === followingId) {
      throw new BadRequestException('Kendinizi takip edemezsiniz');
    }

    const targetUser = await this.userRepository.findOne({ where: { id: followingId } });
    if (!targetUser) {
      throw new NotFoundException('Takip edilecek kullanıcı bulunamadı');
    }

    const existingFollow = await this.followRepository.findOne({
      where: { followerId, followingId },
    });

    if (existingFollow) {
      throw new BadRequestException('Bu kullanıcıyı zaten takip ediyorsunuz');
    }

    const existingRequest = await this.followRequestRepository.findOne({
      where: { senderId: followerId, recipientId: followingId },
    });

    // Eğer targetUser gizli (private) hesapsa:
    if (targetUser.isPrivate) {
      if (existingRequest) {
        throw new BadRequestException('Takip isteği zaten gönderilmiş');
      }
      const newRequest = this.followRequestRepository.create({
        senderId: followerId,
        recipientId: followingId,
      });
      await this.followRequestRepository.save(newRequest);

      // Bildirim oluştur (takip isteği alan kişiye)
      await this.notificationService.create({
        recipientId: followingId,
        senderId: followerId,
        type: NotificationType.FOLLOW_REQUEST,
      });

      return { success: true, isFollowing: false, isRequestSent: true };
    }

    // Eğer targetUser açık (public) hesapsa:
    if (existingRequest) {
      await this.followRequestRepository.remove(existingRequest);
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

    return { success: true, isFollowing: true, isRequestSent: false };
  }

  /** Takibi bırak veya isteği iptal et */
  async unfollow(followingId: string, followerId: string): Promise<{ success: boolean; isFollowing: boolean; isRequestSent: boolean }> {
    const targetUser = await this.userRepository.findOne({ where: { id: followingId } });
    if (!targetUser) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Bekleyen takip isteği var mı?
    const followRequest = await this.followRequestRepository.findOne({
      where: { senderId: followerId, recipientId: followingId },
    });

    if (followRequest) {
      await this.followRequestRepository.remove(followRequest);
      return { success: true, isFollowing: false, isRequestSent: false };
    }

    const followRecord = await this.followRepository.findOne({
      where: { followerId, followingId },
    });

    if (!followRecord) {
      throw new BadRequestException('Bu kullanıcıyı takip etmiyorsunuz');
    }

    await this.followRepository.remove(followRecord);
    await this.updateCounts(followerId, followingId);

    return { success: true, isFollowing: false, isRequestSent: false };
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
  ): Promise<{ isFollowing: boolean; isFollowedBy: boolean; isRequestSent: boolean; isRequestReceived: boolean }> {
    const [isFollowing, isFollowedBy, requestSent, requestReceived] = await Promise.all([
      this.followRepository.findOne({
        where: { followerId: currentUserId, followingId: targetUserId },
      }),
      this.followRepository.findOne({
        where: { followerId: targetUserId, followingId: currentUserId },
      }),
      this.followRequestRepository.findOne({
        where: { senderId: currentUserId, recipientId: targetUserId },
      }),
      this.followRequestRepository.findOne({
        where: { senderId: targetUserId, recipientId: currentUserId },
      }),
    ]);

    return {
      isFollowing: !!isFollowing,
      isFollowedBy: !!isFollowedBy,
      isRequestSent: !!requestSent,
      isRequestReceived: !!requestReceived,
    };
  }

  /** Gelen takip istekleri listesi */
  async getFollowRequests(recipientId: string): Promise<any[]> {
    const list = await this.followRequestRepository.find({
      where: { recipientId },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
    });

    return list.map(item => ({
      id: item.id,
      sender: {
        id: item.sender.id,
        username: item.sender.username,
        fullName: item.sender.fullName,
        avatarUrl: item.sender.avatarUrl,
      },
      createdAt: item.createdAt,
    }));
  }

  /** Takip isteğini kabul et */
  async acceptFollowRequest(requestId: string, recipientId: string): Promise<{ success: boolean }> {
    const request = await this.followRequestRepository.findOne({
      where: { id: requestId, recipientId },
      relations: ['sender'],
    });

    if (!request) {
      throw new NotFoundException('Takip isteği bulunamadı');
    }

    const followerId = request.senderId;
    const followingId = recipientId;

    const existing = await this.followRepository.findOne({
      where: { followerId, followingId },
    });

    if (!existing) {
      const newFollow = this.followRepository.create({ followerId, followingId });
      await this.followRepository.save(newFollow);
      await this.updateCounts(followerId, followingId);

      // Takipçi bildirimini gönder
      await this.notificationService.create({
        recipientId: followerId,
        senderId: followingId,
        type: NotificationType.FOLLOW,
      });
    }

    await this.followRequestRepository.remove(request);

    return { success: true };
  }

  /** Takip isteğini reddet */
  async rejectFollowRequest(requestId: string, recipientId: string): Promise<{ success: boolean }> {
    const request = await this.followRequestRepository.findOne({
      where: { id: requestId, recipientId },
    });

    if (!request) {
      throw new NotFoundException('Takip isteği bulunamadı');
    }

    await this.followRequestRepository.remove(request);
    return { success: true };
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
