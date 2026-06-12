import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from './entities/follow.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async follow(followingId: string, followerId: string): Promise<Follow> {
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

    const newFollow = this.followRepository.create({
      followerId,
      followingId,
    });

    const saved = await this.followRepository.save(newFollow);
    await this.updateCounts(followerId, followingId);

    return saved;
  }

  async unfollow(followingId: string, followerId: string): Promise<{ success: boolean }> {
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

    return { success: true };
  }

  async getFollowers(userId: string): Promise<User[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    const list = await this.followRepository.find({
      where: { followingId: userId },
      relations: ['follower'],
      select: {
        id: true,
        follower: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    });

    return list.map(item => item.follower);
  }

  async getFollowing(userId: string): Promise<User[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    const list = await this.followRepository.find({
      where: { followerId: userId },
      relations: ['following'],
      select: {
        id: true,
        following: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    });

    return list.map(item => item.following);
  }

  private async updateCounts(followerId: string, followingId: string) {
    const followerCount = await this.followRepository.count({ where: { followingId } });
    await this.userRepository.update(followingId, { followerCount });

    const followingCount = await this.followRepository.count({ where: { followerId } });
    await this.userRepository.update(followerId, { followingCount });
  }
}
