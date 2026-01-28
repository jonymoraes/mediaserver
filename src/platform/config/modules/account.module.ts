import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

//  Redis
import { RedisModule } from './redis.module';

//  Entities
import { Account } from 'src/domain/entities/account.entity';

//  Controllers
import { AccountController } from 'src/adapters/inbound/rest/account.controller';

//  Ports
import { AccountPort } from 'src/domain/ports/outbound/account.port';

//  Repositories
import { AccountRepository } from 'src/adapters/outbound/repository/account.repository';

//  Modules
import { QuotaModule } from './quota.module';

//  UseCases
import { GetAccountUseCase } from '@/src/application/use-cases/account/get-account.use-case';
import { GetAccountsUseCase } from '@/src/application/use-cases/account/get-accounts.use-case';
import { CreateAccountUseCase } from 'src/application/use-cases/account/create-account.use-case';
import { UpdateAccountUseCase } from 'src/application/use-cases/account/update-account.use-case';
import { DeleteAccountUseCase } from 'src/application/use-cases/account/delete-account.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account]),
    forwardRef(() => RedisModule),
    forwardRef(() => QuotaModule),
  ],
  controllers: [AccountController],
  providers: [
    GetAccountUseCase,
    GetAccountsUseCase,
    CreateAccountUseCase,
    UpdateAccountUseCase,
    DeleteAccountUseCase,
    {
      provide: AccountPort,
      useExisting: AccountRepository,
    },
    AccountRepository,
  ],
  exports: [AccountPort],
})
export class AccountModule {}
