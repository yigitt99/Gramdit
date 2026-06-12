import { Controller, Post, Get, Patch, Delete, Body, Param, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { CommunityService } from './community.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CommunityRole } from './enums/community-role.enum';

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

  @Post(':id/ban')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async banUser(
    @Param('id') id: string,
    @Body() body: { userId: string; reason?: string },
    @Req() req: Request
  ) {
    const requesterId = (req as any).user.sub;
    return this.communityService.banUser(id, body.userId, requesterId, body.reason);
  }

  @Delete(':id/ban/:userId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async unbanUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Req() req: Request
  ) {
    const requesterId = (req as any).user.sub;
    await this.communityService.unbanUser(id, userId, requesterId);
  }

  @Patch(':id/members/:userId/role')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: { role: string },
    @Req() req: Request
  ) {
    const requesterId = (req as any).user.sub;
    const role = body.role as CommunityRole;
    return this.communityService.updateMemberRole(id, userId, requesterId, role);
  }

  @Delete(':id/members/:userId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async kickMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Req() req: Request
  ) {
    const requesterId = (req as any).user.sub;
    await this.communityService.kickMember(id, userId, requesterId);
  }

  @Get(':id/bans')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getBans(@Param('id') id: string, @Req() req: Request) {
    const requesterId = (req as any).user.sub;
    return this.communityService.getBans(id, requesterId);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async join(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.sub;
    return this.communityService.joinCommunity(id, userId);
  }

  @Delete(':id/leave')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async leave(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.sub;
    await this.communityService.leaveCommunity(id, userId);
  }
}
