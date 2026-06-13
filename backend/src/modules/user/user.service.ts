import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.username !== undefined) {
      const normalizedUsername = dto.username.toLowerCase().trim();
      if (normalizedUsername !== user.username.toLowerCase()) {
        const existing = await this.userRepository.findOne({ where: { username: normalizedUsername } });
        if (existing) {
          throw new BadRequestException('Bu kullanıcı adı zaten alınmış');
        }
        user.username = normalizedUsername;
      }
    }
    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.bio !== undefined) user.bio = dto.bio;
    if (dto.website !== undefined) user.website = dto.website;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;
    if (dto.bannerUrl !== undefined) user.bannerUrl = dto.bannerUrl;
    if (dto.isPrivate !== undefined) user.isPrivate = dto.isPrivate;

    const saved = await this.userRepository.save(user);

    return {
      id: saved.id,
      username: saved.username,
      email: saved.email,
      fullName: saved.fullName,
      bio: saved.bio,
      website: saved.website,
      avatarUrl: saved.avatarUrl,
      bannerUrl: saved.bannerUrl,
      followerCount: saved.followerCount,
      followingCount: saved.followingCount,
      isPrivate: saved.isPrivate,
    };
  }

  async findByUsername(username: string) {
    const cleanUsername = username.replace(/^@/, '').toLowerCase().trim();
    const user = await this.userRepository.findOne({ where: { username: ILike(cleanUsername) } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findById(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async listUsers(search?: string) {
    let users: User[];
    if (search && search.trim()) {
      const q = search.trim();
      users = await this.userRepository.find({
        where: [
          { username: ILike(`%${q}%`), isActive: true },
          { fullName: ILike(`%${q}%`), isActive: true },
        ],
        take: 20,
      });
    } else {
      users = await this.userRepository.find({ where: { isActive: true } });
      // Fisher-Yates shuffle for random order
      for (let i = users.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [users[i], users[j]] = [users[j], users[i]];
      }
      users = users.slice(0, 10);
    }

    return users.map((u) => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      avatarUrl: u.avatarUrl,
      bio: u.bio,
    }));
  }

  verifyToken(token: string): { sub: string; username: string; email: string } {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
