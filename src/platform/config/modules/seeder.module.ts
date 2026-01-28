import { Module, forwardRef, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Account } from '@/src/domain/entities/account.entity';
import { AccountSeeder } from '@/src/adapters/outbound/database/seeds/account.seeder';

import { RedisModule } from './redis.module';

@Module({
  imports: [TypeOrmModule.forFeature([Account]), forwardRef(() => RedisModule)],
  providers: [AccountSeeder],
  exports: [AccountSeeder],
})
export class SeedersModule implements OnModuleInit {
  constructor(private readonly accountSeeder: AccountSeeder) {}

  async onModuleInit() {
    await this.accountSeeder.seedAccounts();
  }
}
