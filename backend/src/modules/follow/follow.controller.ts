import { Controller, Post, Delete, Get, Param, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { FollowService } from './follow.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('users')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

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

  @Get(':id/followers')
  @HttpCode(HttpStatus.OK)
  async getFollowers(@Param('id') userId: string) {
    return this.followService.getFollowers(userId);
  }

  @Get(':id/following')
  @HttpCode(HttpStatus.OK)
  async getFollowing(@Param('id') userId: string) {
    return this.followService.getFollowing(userId);
  }
}
