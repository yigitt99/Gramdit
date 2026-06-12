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
  async findAll() {
    return this.postService.findAll();
  }

  @Get('posts/:id')
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id') id: string) {
    return this.postService.findById(id);
  }

  @Get('communities/:slug/posts')
  @HttpCode(HttpStatus.OK)
  async findCommunityPosts(@Param('slug') slug: string) {
    return this.postService.findCommunityPosts(slug);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.sub;
    await this.postService.delete(id, userId);
  }
}
