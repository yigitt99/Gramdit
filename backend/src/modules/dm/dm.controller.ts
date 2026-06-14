import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { DmService } from './dm.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('dm')
@UseGuards(JwtAuthGuard)
export class DmController {
  constructor(private readonly dmService: DmService) {}

  /** POST /dm/conversations — Sohbet odası oluştur veya mevcut birebir sohbeti getir */
  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  async createConversation(
    @Body() dto: CreateConversationDto,
    @Req() req: Request,
  ) {
    const currentUserId = (req as any).user.sub;
    return this.dmService.createConversation(currentUserId, dto);
  }

  /** GET /dm/conversations — Kullanıcının dahil olduğu sohbet listesi */
  @Get('conversations')
  async getConversations(@Req() req: Request) {
    const currentUserId = (req as any).user.sub;
    return this.dmService.getConversations(currentUserId);
  }

  /** GET /dm/conversations/:id — Belirli bir sohbet odasının detayı */
  @Get('conversations/:id')
  async getConversation(
    @Param('id') conversationId: string,
    @Req() req: Request,
  ) {
    const currentUserId = (req as any).user.sub;
    return this.dmService.getConversation(currentUserId, conversationId);
  }

  /** POST /dm/conversations/:id/messages — Mesaj gönder */
  @Post('conversations/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @Param('id') conversationId: string,
    @Body() dto: CreateMessageDto,
    @Req() req: Request,
  ) {
    const currentUserId = (req as any).user.sub;
    return this.dmService.sendMessage(currentUserId, conversationId, dto);
  }

  /** GET /dm/conversations/:id/messages — Mesajları listele */
  @Get('conversations/:id/messages')
  async getMessages(
    @Param('id') conversationId: string,
    @Req() req: Request,
  ) {
    const currentUserId = (req as any).user.sub;
    return this.dmService.getMessages(currentUserId, conversationId);
  }
}
