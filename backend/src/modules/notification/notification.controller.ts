import {
  Controller,
  Get,
  Patch,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /** GET /notifications — Tüm bildirimler */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getNotifications(@Req() req: Request) {
    const userId = (req as any).user.sub;
    return this.notificationService.getForUser(userId);
  }

  /** GET /notifications/unread-count — Okunmamış sayısı */
  @Get('unread-count')
  @HttpCode(HttpStatus.OK)
  async getUnreadCount(@Req() req: Request) {
    const userId = (req as any).user.sub;
    const count = await this.notificationService.getUnreadCount(userId);
    return { count };
  }

  /** PATCH /notifications/read-all — Tümünü okundu işaretle */
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Req() req: Request) {
    const userId = (req as any).user.sub;
    return this.notificationService.markAllAsRead(userId);
  }

  /** PATCH /notifications/:id/read — Tek bildirimi okundu işaretle */
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.sub;
    return this.notificationService.markAsRead(id, userId);
  }
}
