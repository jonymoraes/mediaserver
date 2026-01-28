import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  Relation,
} from 'typeorm';
//  Entities
import { Quota } from './quota.entity';

//  Constants
import { Roles } from 'src/platform/shared/constants/account/roles';
import { ApiKeyStatus } from 'src/platform/shared/constants/status/apikey';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  apikey: string;

  @Column({
    type: 'enum',
    enum: ApiKeyStatus,
    default: ApiKeyStatus.ACTIVE,
  })
  status: ApiKeyStatus;

  @Column()
  name: string;

  @Column({ nullable: true })
  domain?: string;

  @Column({ nullable: true })
  folder?: string;

  @Column({ nullable: true })
  storagePath?: string;

  @Column({ type: 'bigint', default: '0' })
  usedBytes: string;

  @Column({
    type: 'enum',
    enum: Roles,
    default: Roles.USER,
  })
  role: Roles;

  @OneToMany(() => Quota, (quota) => quota.account)
  quotas?: Relation<Quota>[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
