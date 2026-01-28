import { Module, forwardRef } from '@nestjs/common';

//  Controllers
import { StorageController } from 'src/adapters/inbound/rest/storage.controller';

//  Modules
import { AccountModule } from './account.module';
import { QuotaModule } from './quota.module';

//  UseCases
import { UpdateTransferUseCase } from '@/src/application/use-cases/storage/update-transfer.use-case';

//  Websockets
import { WebsocketGuard } from '../../shared/guards/websocket.guard';
import { QuotaGateway } from '@/src/adapters/inbound/websockets/quota.gateway';

@Module({
  imports: [forwardRef(() => AccountModule), forwardRef(() => QuotaModule)],
  controllers: [StorageController],
  providers: [UpdateTransferUseCase, WebsocketGuard, QuotaGateway],
})
export class StorageModule {}
