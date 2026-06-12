import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { FollowService } from './follow.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('users')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  /** POST /users/:id/follow — Takip et */
  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async follow(
    @Param('id') followingId: string,
    @Req() req: Request,
  ) {
    const followerId = (req as any).user.sub;
    return this.followService.follow(followingId, followerId);
  }

  /** DELETE /users/:id/follow — Takibi bırak */
  @Delete(':id/follow')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async unfollow(
    @Param('id') followingId: string,
    @Req() req: Request,
  ) {
    const followerId = (req as any).user.sub;
    return this.followService.unfollow(followingId, followerId);
  }

  /** GET /users/:id/followers — Takipçi listesi */
  @Get(':id/followers')
  @HttpCode(HttpStatus.OK)
  async getFollowers(@Param('id') userId: string) {
    return this.followService.getFollowers(userId);
  }

  /** GET /users/:id/following — Takip edilenler listesi */
  @Get(':id/following')
  @HttpCode(HttpStatus.OK)
  async getFollowing(@Param('id') userId: string) {
    return this.followService.getFollowing(userId);
  }

  /** GET /users/:id/follow-status — Takip durumu (oturum açık kullanıcı için) */
  @Get(':id/follow-status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getFollowStatus(
    @Param('id') targetUserId: string,
    @Req() req: Request,
  ) {
    const currentUserId = (req as any).user.sub;
    return this.followService.getFollowStatus(currentUserId, targetUserId);
  }
}
