import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

//  BullMQ
import { BullModule } from '@nestjs/bullmq';
import { VideoTranscoderWorker } from '@/src/adapters/outbound/processing/workers/video-transcoder.worker';

//  Redis
import { RedisModule } from './redis.module';

//  Entities
import { Video } from 'src/domain/entities/video.entity';

//  Controllers
import { VideoController } from '@/src/adapters/inbound/rest/video.controller';

//  Ports
import { VideoPort } from 'src/domain/ports/outbound/video.port';

//  Repositories
import { VideoRepository } from 'src/adapters/outbound/repository/video.repository';

//  CronJobs
import { CleanupVideoCron } from '@/src/adapters/inbound/cron/cleanup-video.cron';

//  Modules
import { AccountModule } from './account.module';
import { QuotaModule } from './quota.module';

//  UseCases
import { UploadVideoUseCase } from 'src/application/use-cases/video/upload-video.use-case';
import { CancelVideoProcessUseCase } from '@/src/application/use-cases/video/cancel-video-process.use-case';
import { UpdateVideoStatusUseCase } from 'src/application/use-cases/video/update-video-status.use-case';
import { DeleteVideoUseCase } from '@/src/application/use-cases/video/delete-video.use-case';

//  Websockets
import { WebsocketGuard } from '@/src/platform/shared/guards/websocket.guard';
import { VideoGateway } from '@/src/adapters/inbound/websockets/video.gateway';
import { QuotaGateway } from '@/src/adapters/inbound/websockets/quota.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Video]),
    BullModule.registerQueue({ name: 'video-processing' }),
    forwardRef(() => RedisModule),
    forwardRef(() => AccountModule),
    forwardRef(() => QuotaModule),
  ],
  controllers: [VideoController],
  providers: [
    UploadVideoUseCase,
    CancelVideoProcessUseCase,
    UpdateVideoStatusUseCase,
    DeleteVideoUseCase,
    VideoGateway,
    QuotaGateway,
    CleanupVideoCron,
    VideoTranscoderWorker,
    {
      provide: VideoPort,
      useExisting: VideoRepository,
    },
    WebsocketGuard,
    VideoRepository,
  ],
  exports: [VideoPort],
})
export class VideoModule {}
