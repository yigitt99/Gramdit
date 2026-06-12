import { Controller, Post, Get, Body, Param, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { CommunityService } from './community.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('communities')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCommunityDto: CreateCommunityDto, @Req() req: Request) {
    const userId = (req as any).user.sub;
    return this.communityService.create(createCommunityDto, userId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return this.communityService.findAll();
  }

  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  async findBySlug(@Param('slug') slug: string) {
    return this.communityService.findBySlug(slug);
  }

  @Get(':id/members')
  @HttpCode(HttpStatus.OK)
  async findMembers(@Param('id') id: string) {
    return this.communityService.findMembers(id);
  }

  @Get(':id/members/:userId')
  @HttpCode(HttpStatus.OK)
  async findMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.communityService.findMember(id, userId);
  }
}
