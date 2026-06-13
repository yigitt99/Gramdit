import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../enums/user-role.enum';
import { CommunityMember } from '../../community/entities/community-member.entity';
import { Post } from '../../post/entities/post.entity';
import { Comment } from '../../comment/entities/comment.entity';
import { Reaction } from '../../reaction/entities/reaction.entity';
import { Follow } from '../../follow/entities/follow.entity';
import { Notification } from '../../notification/entities/notification.entity';
import { CommunityBan } from '../../community/entities/community-ban.entity';
import { SavedPost } from '../../post/entities/saved-post.entity';
import { Repost } from '../../post/entities/repost.entity';

@Entity('users')
@Index('IDX_users_username', ['username'], { unique: true })
@Index('IDX_users_email', ['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => CommunityMember, (member) => member.user)
  communityMembers: CommunityMember[];

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments: Comment[];

  @OneToMany(() => Reaction, (reaction) => reaction.user)
  reactions: Reaction[];

  @OneToMany(() => SavedPost, (savedPost) => savedPost.user)
  savedPosts: SavedPost[];

  @OneToMany(() => Repost, (repost) => repost.user)
  reposts: Repost[];

  @Column({ type: 'integer', default: 0, name: 'follower_count' })
  followerCount: number;

  @Column({ type: 'integer', default: 0, name: 'following_count' })
  followingCount: number;

  @OneToMany(() => Follow, (follow) => follow.follower)
  following: Follow[];

  @OneToMany(() => Follow, (follow) => follow.following)
  followers: Follow[];

  @OneToMany(() => Notification, (n) => n.recipient)
  notifications: Notification[];

  @OneToMany(() => Notification, (n) => n.sender)
  sentNotifications: Notification[];

  @OneToMany(() => CommunityBan, (ban) => ban.user)
  communityBans: CommunityBan[];

  @OneToMany(() => CommunityBan, (ban) => ban.bannedBy)
  givenCommunityBans: CommunityBan[];

  @Column({
    type: 'varchar',
    length: 30,
    unique: true,
    nullable: false,
  })
  username: string;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
    nullable: false,
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    name: 'password_hash',
  })
  passwordHash: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'full_name',
  })
  fullName: string | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  bio: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  website: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    name: 'avatar_url',
  })
  avatarUrl: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    name: 'banner_url',
  })
  bannerUrl: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'boolean',
    default: true,
    name: 'is_active',
  })
  isActive: boolean;

  @Column({
    type: 'boolean',
    default: false,
    name: 'is_private',
  })
  isPrivate: boolean;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    name: 'updated_at',
  })
  updatedAt: Date;
}
