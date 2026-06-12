import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Community } from './community.entity';
import { User } from '../../user/entities/user.entity';

@Entity('community_bans')
@Index('IDX_community_bans_unique', ['communityId', 'userId'], { unique: true })
export class CommunityBan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'community_id', type: 'uuid' })
  communityId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'banned_by_id', type: 'uuid' })
  bannedById: string;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @ManyToOne(() => Community, (community) => community.bans, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'community_id' })
  community: Community;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'banned_by_id' })
  bannedBy: User;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;
}
