import { Controller, Post, Get, Body, Param, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { PostMediaService } from './post-media.service';
import { CreatePostMediaDto } from './dto/create-post-media.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('posts')
export class PostMediaController {
  constructor(private readonly postMediaService: PostMediaService) {}

  @Post(':id/media')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('id') id: string,
    @Body() createPostMediaDto: CreatePostMediaDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.sub;
    return this.postMediaService.create(id, createPostMediaDto, userId);
  }

  @Get(':id/media')
  @HttpCode(HttpStatus.OK)
  async findByPostId(@Param('id') id: string) {
    return this.postMediaService.findByPostId(id);
  }
}
