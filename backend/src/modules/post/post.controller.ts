import { Controller, Post, Get, Delete, Body, Param, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller()
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPostDto: CreatePostDto, @Req() req: Request) {
    const authorId = (req as any).user.sub;
    return this.postService.create(createPostDto, authorId);
  }

  @Get('posts')
  @HttpCode(HttpStatus.OK)
  async findAll(@Req() req: Request) {
    return this.postService.findAll(req);
  }

  @Get('posts/:id')
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id') id: string, @Req() req: Request) {
    return this.postService.findById(id, req);
  }

  @Get('communities/:slug/posts')
  @HttpCode(HttpStatus.OK)
  async findCommunityPosts(@Param('slug') slug: string, @Req() req: Request) {
    return this.postService.findCommunityPosts(slug, req);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.sub;
    await this.postService.delete(id, userId);
  }

  @Post('posts/:id/save')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async save(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.sub;
    return this.postService.savePost(id, userId);
  }

  @Delete('posts/:id/save')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsave(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.sub;
    await this.postService.unsavePost(id, userId);
  }

  @Get('users/me/saved-posts')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getSavedPosts(@Req() req: Request) {
    const userId = (req as any).user.sub;
    return this.postService.getSavedPosts(userId);
  }

  @Post('posts/:id/repost')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async repost(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.sub;
    return this.postService.repost(id, userId);
  }

  @Delete('posts/:id/repost')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async unrepost(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.sub;
    await this.postService.unrepost(id, userId);
  }

  @Get('posts/:id/reposts')
  @HttpCode(HttpStatus.OK)
  async getRepostsForPost(@Param('id') id: string) {
    return this.postService.getRepostsForPost(id);
  }

  @Get('users/:username/reposts')
  @HttpCode(HttpStatus.OK)
  async getUserReposts(@Param('username') username: string) {
    return this.postService.getUserReposts(username);
  }
}
