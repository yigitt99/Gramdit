import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Community } from '../../community/entities/community.entity';
import { PostMedia } from '../../post-media/entities/post-media.entity';
import { Comment } from '../../comment/entities/comment.entity';
import { Reaction } from '../../reaction/entities/reaction.entity';
import { SavedPost } from './saved-post.entity';
import { Repost } from './repost.entity';

@Entity('posts')
@Index('IDX_posts_author', ['authorId'])
@Index('IDX_posts_community', ['communityId'])
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => PostMedia, (postMedia) => postMedia.post)
  media: PostMedia[];

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @OneToMany(() => Reaction, (reaction) => reaction.post)
  reactions: Reaction[];

  @OneToMany(() => SavedPost, (savedPost) => savedPost.post)
  savedPosts: SavedPost[];

  @OneToMany(() => Repost, (repost) => repost.post)
  reposts: Repost[];

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId: string;

  @Column({ name: 'community_id', type: 'uuid', nullable: true })
  communityId: string | null;

  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @ManyToOne(() => Community, (community) => community.posts, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'community_id' })
  community: Community | null;

  @Column({ type: 'integer', default: 0, name: 'comment_count' })
  commentCount: number;

  @Column({ type: 'integer', default: 0, name: 'reaction_count' })
  reactionCount: number;

  @Column({ type: 'integer', default: 0, name: 'repost_count' })
  repostCount: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    name: 'updated_at',
  })
  updatedAt: Date;
}
