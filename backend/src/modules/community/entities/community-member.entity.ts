import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Community } from './community.entity';
import { User } from '../../user/entities/user.entity';
import { CommunityRole } from '../enums/community-role.enum';

@Entity('community_members')
@Index('IDX_community_members_unique', ['communityId', 'userId'], { unique: true })
export class CommunityMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'community_id', type: 'uuid' })
  communityId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => Community, (community) => community.members, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'community_id' })
  community: Community;

  @ManyToOne(() => User, (user) => user.communityMembers, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: CommunityRole,
    default: CommunityRole.MEMBER,
  })
  role: CommunityRole;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'joined_at' })
  joinedAt: Date;
}
