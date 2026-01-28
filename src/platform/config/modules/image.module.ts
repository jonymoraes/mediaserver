import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

//  BullMQ
import { BullModule } from '@nestjs/bullmq';
import { ImageConverterWorker } from '@/src/adapters/outbound/processing/workers/image-converter.worker';

//  Redis
import { RedisModule } from './redis.module';

//  Entities
import { Image } from 'src/domain/entities/image.entity';

//  Controllers
import { ImageController } from '@/src/adapters/inbound/rest/image.controller';

//  Ports
import { ImagePort } from 'src/domain/ports/outbound/image.port';

//  Repositories
import { ImageRepository } from 'src/adapters/outbound/repository/image.repository';

//  CronJobs
import { CleanupImageCron } from '@/src/adapters/inbound/cron/cleanup-image.cron';

//  Modules
import { AccountModule } from './account.module';
import { QuotaModule } from './quota.module';

//  UseCases
import { UploadImageUseCase } from 'src/application/use-cases/image/upload-image.use-case';
import { UpdateImageStatusUseCase } from 'src/application/use-cases/image/update-image-status.use-case';
import { CancelImageProcessUseCase } from '@/src/application/use-cases/image/cancel-image-process.use-case';
import { DeleteImageUseCase } from 'src/application/use-cases/image/delete-image.use-case';

//  Websockets
import { WebsocketGuard } from '@/src/platform/shared/guards/websocket.guard';
import { ImageGateway } from '@/src/adapters/inbound/websockets/image.gateway';
import { QuotaGateway } from '@/src/adapters/inbound/websockets/quota.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Image]),
    BullModule.registerQueue({ name: 'image-processing' }),
    forwardRef(() => RedisModule),
    forwardRef(() => AccountModule),
    forwardRef(() => QuotaModule),
  ],
  controllers: [ImageController],
  providers: [
    UploadImageUseCase,
    CancelImageProcessUseCase,
    UpdateImageStatusUseCase,
    DeleteImageUseCase,
    ImageGateway,
    QuotaGateway,
    CleanupImageCron,
    ImageConverterWorker,
    {
      provide: ImagePort,
      useExisting: ImageRepository,
    },
    WebsocketGuard,
    ImageRepository,
  ],
  exports: [ImagePort],
})
export class ImageModule {}
