import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { NotificationType } from '../enums/notification-type.enum';

@Entity('notifications')
@Index('IDX_notifications_recipient', ['recipientId'])
@Index('IDX_notifications_created_at', ['createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Bildirimi alan kullanıcı */
  @Column({ name: 'recipient_id', type: 'uuid' })
  recipientId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'recipient_id' })
  recipient: User;

  /** Bildirimi tetikleyen kullanıcı */
  @Column({ name: 'sender_id', type: 'uuid', nullable: true })
  senderId: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'sender_id' })
  sender: User | null;

  /** Bildirim türü */
  @Column({
    type: 'enum',
    enum: NotificationType,
    name: 'type',
  })
  type: NotificationType;

  /** İlgili kayıt ID (post, comment vb.) */
  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId: string | null;

  /** Okundu mu? */
  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created_at',
  })
  createdAt: Date;
}
