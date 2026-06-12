import { Controller, Post, Get, Body, Param, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { ReactionService } from './reaction.service';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller()
export class ReactionController {
  constructor(private readonly reactionService: ReactionService) {}

  @Post('posts/:id/reactions')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async postReaction(
    @Param('id') postId: string,
    @Body() dto: CreateReactionDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.sub;
    return this.reactionService.handlePostReaction(postId, userId, dto);
  }

  @Post('comments/:id/reactions')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async commentReaction(
    @Param('id') commentId: string,
    @Body() dto: CreateReactionDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.sub;
    return this.reactionService.handleCommentReaction(commentId, userId, dto);
  }

  @Get('posts/:id/reactions')
  @HttpCode(HttpStatus.OK)
  async getPostReactions(@Param('id') postId: string) {
    return this.reactionService.getPostReactions(postId);
  }

  @Get('comments/:id/reactions')
  @HttpCode(HttpStatus.OK)
  async getCommentReactions(@Param('id') commentId: string) {
    return this.reactionService.getCommentReactions(commentId);
  }
}
