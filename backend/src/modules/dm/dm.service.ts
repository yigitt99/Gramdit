import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { DmConversation } from './entities/dm-conversation.entity';
import { DmConversationMember } from './entities/dm-conversation-member.entity';
import { DmMessage } from './entities/dm-message.entity';
import { User } from '../user/entities/user.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class DmService {
  constructor(
    @InjectRepository(DmConversation)
    private readonly conversationRepository: Repository<DmConversation>,
    @InjectRepository(DmConversationMember)
    private readonly memberRepository: Repository<DmConversationMember>,
    @InjectRepository(DmMessage)
    private readonly messageRepository: Repository<DmMessage>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /** Sohbet odası oluştur veya mevcut birebir sohbeti getir */
  async createConversation(currentUserId: string, dto: CreateConversationDto): Promise<DmConversation> {
    const { userIds } = dto;

    // Kendini userIds listesinden temizle (varsa) ve benzersiz yap
    const uniqueUserIds = Array.from(new Set(userIds.filter(id => id !== currentUserId)));

    if (uniqueUserIds.length === 0) {
      throw new BadRequestException('En az bir alıcı kullanıcı belirtmelisiniz.');
    }

    // Alıcıların veritabanında var olduğunu kontrol et
    const validUsers = await this.userRepository.find({
      where: { id: In(uniqueUserIds) },
    });

    if (validUsers.length !== uniqueUserIds.length) {
      throw new NotFoundException('Belirtilen alıcılardan biri veya birkaçı bulunamadı.');
    }

    // 1. Birebir sohbet kontrolü (Eğer tek alıcı varsa)
    if (uniqueUserIds.length === 1) {
      const targetUserId = uniqueUserIds[0];

      // Hem currentUserId hem de targetUserId'nin katıldığı, toplamda sadece 2 üyesi olan konuşmaları bul
      const query = this.conversationRepository
        .createQueryBuilder('conversation')
        .innerJoinAndSelect('conversation.members', 'members')
        .innerJoinAndSelect('members.user', 'user');

      const conversations = await query.getMany();

      const existingConversation = conversations.find(conv => {
        if (conv.members.length !== 2) return false;
        const memberIds = conv.members.map(m => m.userId);
        return memberIds.includes(currentUserId) && memberIds.includes(targetUserId);
      });

      if (existingConversation) {
        return existingConversation;
      }
    }

    // 2. Yeni sohbet oluştur (Birebir yoksa veya grup sohbetiyse)
    const newConversation = this.conversationRepository.create();
    const savedConversation = await this.conversationRepository.save(newConversation);

    // Üyeleri ekle (kendisi dahil)
    const membersToCreate = [currentUserId, ...uniqueUserIds].map(userId => {
      return this.memberRepository.create({
        conversationId: savedConversation.id,
        userId,
      });
    });

    await this.memberRepository.save(membersToCreate);

    // Güncel ilişkilerle geri dön
    return this.getConversation(currentUserId, savedConversation.id);
  }

  /** Kullanıcının dahil olduğu sohbet listesi */
  async getConversations(userId: string): Promise<any[]> {
    // Önce kullanıcının üyesi olduğu conversationId'leri bulalım
    const userMemberships = await this.memberRepository.find({
      where: { userId },
      select: ['conversationId'],
    });

    if (userMemberships.length === 0) {
      return [];
    }

    const conversationIds = userMemberships.map(m => m.conversationId);

    // Bu sohbetleri detaylıca çekelim (üyeleri ve son mesajlarıyla birlikte)
    const conversations = await this.conversationRepository.find({
      where: { id: In(conversationIds) },
      relations: ['members', 'members.user', 'messages', 'messages.sender'],
      order: { updatedAt: 'DESC' },
    });

    // Arayüze daha temiz bir veri modeli göndermek için map edelim
    return conversations.map(conv => {
      // Mesajları tarihe göre sıralayıp son mesajı bulalım
      const sortedMessages = [...conv.messages].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const lastMessage = sortedMessages[0] || null;

      return {
        id: conv.id,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        members: conv.members.map(m => ({
          id: m.id,
          joinedAt: m.joinedAt,
          user: {
            id: m.user.id,
            username: m.user.username,
            fullName: m.user.fullName,
            avatarUrl: m.user.avatarUrl,
          },
        })),
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
          sender: {
            id: lastMessage.sender.id,
            username: lastMessage.sender.username,
          },
        } : null,
      };
    });
  }

  /** Belirli bir sohbet odasının detayı */
  async getConversation(userId: string, conversationId: string): Promise<DmConversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['members', 'members.user'],
    });

    if (!conversation) {
      throw new NotFoundException('Sohbet odası bulunamadı.');
    }

    // Kullanıcı bu sohbet odasının üyesi mi?
    const isMember = conversation.members.some(m => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('Bu sohbet odasına erişim yetkiniz yok.');
    }

    return conversation;
  }

  /** Mesaj gönder */
  async sendMessage(userId: string, conversationId: string, dto: CreateMessageDto): Promise<DmMessage> {
    // Sohbet odasını kontrol et ve üyelik doğrula
    await this.getConversation(userId, conversationId);

    // Mesajı oluştur
    const message = this.messageRepository.create({
      conversationId,
      senderId: userId,
      content: dto.content,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Konuşmanın updatedAt zamanını güncelle ki listelemede en üste gelsin
    await this.conversationRepository.update(conversationId, {
      updatedAt: new Date(),
    });

    // İlişkilerle (gönderici detaylarıyla) birlikte dönelim
    return this.messageRepository.findOneOrFail({
      where: { id: savedMessage.id },
      relations: ['sender'],
    });
  }

  /** Mesajları listele */
  async getMessages(userId: string, conversationId: string): Promise<DmMessage[]> {
    // Sohbet odasını kontrol et ve üyelik doğrula
    await this.getConversation(userId, conversationId);

    // Son 100 mesajı getirelim
    return this.messageRepository.find({
      where: { conversationId },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
      take: 100,
    });
  }
}
