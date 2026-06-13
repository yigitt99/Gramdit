import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Post } from './post.entity';

@Entity('reposts')
@Index('IDX_reposts_user', ['userId'])
@Index('IDX_reposts_post', ['postId'])
@Index('IDX_reposts_user_post', ['userId', 'postId'], { unique: true })
export class Repost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId: string;

  @Column({ name: 'post_id', type: 'uuid', nullable: false })
  postId: string;

  @ManyToOne(() => User, (user) => user.reposts, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Post, (post) => post.reposts, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;
}
