import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationType } from './enums/notification-type.enum';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  /**
   * Yeni bildirim oluştur.
   * Kullanıcı kendi kendine bildirim almaz.
   */
  async create(params: {
    recipientId: string;
    senderId: string;
    type: NotificationType;
    referenceId?: string;
  }): Promise<void> {
    // Kullanıcı kendi işlemi için bildirim almaz
    if (params.recipientId === params.senderId) return;

    const notification = this.notificationRepository.create({
      recipientId: params.recipientId,
      senderId: params.senderId,
      type: params.type,
      referenceId: params.referenceId ?? null,
      isRead: false,
    });

    await this.notificationRepository.save(notification);
  }

  /**
   * GET /notifications — Kullanıcının tüm bildirimleri (yeniden eskiye)
   */
  async getForUser(recipientId: string): Promise<any[]> {
    const list = await this.notificationRepository.find({
      where: { recipientId },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      take: 50,
    });

    return list.map(n => ({
      id: n.id,
      type: n.type,
      referenceId: n.referenceId,
      isRead: n.isRead,
      createdAt: n.createdAt,
      sender: n.sender
        ? {
            id: n.sender.id,
            username: n.sender.username,
            fullName: n.sender.fullName,
            avatarUrl: n.sender.avatarUrl,
          }
        : null,
    }));
  }

  /**
   * Okunmamış bildirim sayısı
   */
  async getUnreadCount(recipientId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { recipientId, isRead: false },
    });
  }

  /**
   * PATCH /notifications/:id/read — Tek bildirimi okundu işaretle
   */
  async markAsRead(id: string, recipientId: string): Promise<{ success: boolean }> {
    await this.notificationRepository.update(
      { id, recipientId },
      { isRead: true },
    );
    return { success: true };
  }

  /**
   * PATCH /notifications/read-all — Tümünü okundu işaretle
   */
  async markAllAsRead(recipientId: string): Promise<{ success: boolean }> {
    await this.notificationRepository.update(
      { recipientId, isRead: false },
      { isRead: true },
    );
    return { success: true };
  }
}
