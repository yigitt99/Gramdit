import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { DmConversation } from './dm-conversation.entity';
import { User } from '../../user/entities/user.entity';

@Entity('dm_conversation_members')
@Index('IDX_dm_conversation_members_conversation', ['conversationId'])
@Index('IDX_dm_conversation_members_user', ['userId'])
@Unique('UQ_dm_conversation_members_conversation_user', ['conversationId', 'userId'])
export class DmConversationMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId: string;

  @ManyToOne(() => DmConversation, (conversation) => conversation.members, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'conversation_id' })
  conversation: DmConversation;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'joined_at' })
  joinedAt: Date;
}
