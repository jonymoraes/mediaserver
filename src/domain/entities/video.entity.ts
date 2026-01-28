import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';

//  Entities
import { Quota } from './quota.entity';
import { Account } from './account.entity';

//  Constants
import { MediaStatus } from 'src/platform/shared/constants/status/media';

@Entity('videos')
export class Video {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string;

  @Column()
  mimetype: string;

  @Column({ type: 'bigint' })
  filesize: string;

  @Column({ type: 'enum', enum: MediaStatus, default: MediaStatus.TEMPORARY })
  status: MediaStatus;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @ManyToOne(() => Quota, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'quotaId' })
  quota?: Relation<Quota>;

  @Column({ type: 'uuid', nullable: true })
  quotaId?: string;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId' })
  account?: Relation<Account>;

  @Column({ type: 'uuid' })
  accountId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
