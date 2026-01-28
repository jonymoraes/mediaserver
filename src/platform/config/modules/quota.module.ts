import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

//  Redis
import { RedisModule } from './redis.module';

//  Entities
import { Quota } from 'src/domain/entities/quota.entity';

//  Controllers
import { QuotaController } from '@/src/adapters/inbound/rest/quota.controller';

//  Ports
import { QuotaPort } from 'src/domain/ports/outbound/quota.port';

//  Repositories
import { QuotaRepository } from 'src/adapters/outbound/repository/quota.repository';

//  Modules
import { AccountModule } from './account.module';

//  UseCases
import { GetQuotaUseCase } from 'src/application/use-cases/quota/get-quota.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quota]),
    forwardRef(() => RedisModule),
    forwardRef(() => AccountModule),
  ],
  controllers: [QuotaController],
  providers: [
    GetQuotaUseCase,
    {
      provide: QuotaPort,
      useExisting: QuotaRepository,
    },
    QuotaRepository,
  ],
  exports: [QuotaPort],
})
export class QuotaModule {}
