import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { DmConversationMember } from './dm-conversation-member.entity';
import { DmMessage } from './dm-message.entity';

@Entity('dm_conversations')
export class DmConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => DmConversationMember, (member) => member.conversation)
  members: DmConversationMember[];

  @OneToMany(() => DmMessage, (message) => message.conversation)
  messages: DmMessage[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP', name: 'updated_at' })
  updatedAt: Date;
}
