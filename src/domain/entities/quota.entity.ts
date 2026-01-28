import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Relation,
} from 'typeorm';

//  Entities
import { Account } from './account.entity';

@Entity('quotas')
@Index(['accountId', 'period'], { unique: true })
export class Quota {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Account, (account) => account.quotas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'accountId' })
  account?: Relation<Account>;

  @Column({ type: 'uuid' })
  accountId: string;

  @Column({ length: 7 })
  period: string;

  @Column({ type: 'bigint', default: '0' })
  transferredBytes: string;

  @Column({ type: 'int', default: 0 })
  totalRequests: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
