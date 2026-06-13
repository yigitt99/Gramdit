import { Controller, Post, Get, Patch, Delete, Body, Param, Req, UseGuards, HttpCode, HttpStatus, UseInterceptors, UploadedFile, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { CommunityService } from './community.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CommunityRole } from './enums/community-role.enum';

const COMMUNITY_AVATARS_DIR = join(process.cwd(), 'uploads', 'communities', 'avatars');
const COMMUNITY_BANNERS_DIR = join(process.cwd(), 'uploads', 'communities', 'banners');

// Ensure directories exist
if (!existsSync(COMMUNITY_AVATARS_DIR)) mkdirSync(COMMUNITY_AVATARS_DIR, { recursive: true });
if (!existsSync(COMMUNITY_BANNERS_DIR)) mkdirSync(COMMUNITY_BANNERS_DIR, { recursive: true });

const communityAvatarStorage = diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    cb(null, COMMUNITY_AVATARS_DIR);
  },
  filename: (_req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + extname(file.originalname));
  },
});

const communityBannerStorage = diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    cb(null, COMMUNITY_BANNERS_DIR);
  },
  filename: (_req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + extname(file.originalname));
  },
});

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

  @Get(':id/ban-status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getBanStatus(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.sub;
    const ban = await this.communityService.getBanDetails(id, userId);
    return {
      isBanned: !!ban,
      reason: ban ? ban.reason : null,
      createdAt: ban ? ban.createdAt : null,
      bannedBy: ban && ban.bannedBy ? {
        id: ban.bannedBy.id,
        username: ban.bannedBy.username,
        fullName: ban.bannedBy.fullName,
      } : null,
    };
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

  @Patch(':id/theme-color')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateThemeColor(
    @Param('id') id: string,
    @Body() body: { themeColor: string | null },
    @Req() req: Request
  ) {
    const requesterId = (req as any).user.sub;
    return this.communityService.updateThemeColor(id, requesterId, body.themeColor);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateCommunityDto: UpdateCommunityDto,
    @Req() req: Request
  ) {
    const requesterId = (req as any).user.sub;
    return this.communityService.update(id, requesterId, updateCommunityDto);
  }

  @Post(':id/avatar')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: communityAvatarStorage,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_req: any, file: any, cb: any) => {
        const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
        if (!allowed.test(extname(file.originalname))) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const requesterId = (req as any).user.sub;

    // Check if requester is founder/moderator
    const isMember = await this.communityService.findMember(id, requesterId);
    if (!isMember || (isMember.role !== CommunityRole.FOUNDER && isMember.role !== CommunityRole.MODERATOR)) {
      throw new ForbiddenException('Only community founders or moderators can update community avatar');
    }

    const avatarUrl = `http://localhost:3000/uploads/communities/avatars/${file.filename}`;
    const updated = await this.communityService.update(id, requesterId, { avatarUrl });
    return { avatarUrl: updated.avatarUrl };
  }

  @Post(':id/banner')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('banner', {
      storage: communityBannerStorage,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_req: any, file: any, cb: any) => {
        const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
        if (!allowed.test(extname(file.originalname))) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadBanner(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const requesterId = (req as any).user.sub;

    // Check if requester is founder/moderator
    const isMember = await this.communityService.findMember(id, requesterId);
    if (!isMember || (isMember.role !== CommunityRole.FOUNDER && isMember.role !== CommunityRole.MODERATOR)) {
      throw new ForbiddenException('Only community founders or moderators can update community banner');
    }

    const bannerUrl = `http://localhost:3000/uploads/communities/banners/${file.filename}`;
    const updated = await this.communityService.update(id, requesterId, { bannerUrl });
    return { bannerUrl: updated.bannerUrl };
  }
}
