import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { promises as fs } from 'fs';

//  Dtos
import { QuotaToDto } from '@/src/application/dto/to-dto/quota.to-dto';

//  Entities
import { Video } from '@/src/domain/entities/video.entity';

//  Port
import { VideoPort } from '@/src/domain/ports/outbound/video.port';

//  Websockets
import { QuotaGateway } from '../websockets/quota.gateway';

@Injectable()
export class CleanupVideoCron {
  private readonly logger = new Logger(CleanupVideoCron.name);

  constructor(
    private readonly videoPort: VideoPort,
    private readonly quotaGateway: QuotaGateway,
  ) {}

  @Cron(CronExpression.EVERY_3_HOURS)
  async cleanup(batchSize = 100) {
    this.logger.log('Starting video cleanup job...');

    let totalDeleted = 0;

    while (true) {
      const batch: Video[] = await this.videoPort.findExpired(batchSize);
      if (!batch.length) break;

      await Promise.all(
        batch.map(async (video) => {
          try {
            const quota = video.quota;
            const account = video.account;
            if (!account || !quota || !account.storagePath) return;

            if (video.account?.storagePath) {
              await fs.unlink(video.account?.storagePath).catch(() => {});
            }

            //  Delete image from database
            await this.videoPort.delete(video.id);

            //  Update quota
            account.usedBytes = (
              BigInt(account.usedBytes) - BigInt(video.filesize)
            ).toString();

            //  Emit changes
            this.quotaGateway.emitQuota(QuotaToDto.fromEntity(quota));

            totalDeleted++;
          } catch (err) {
            this.logger.error(
              `Failed to delete video ${video.id}: ${err.message}`,
            );
          }
        }),
      );

      this.logger.log(`Video cleanup finished. Total deleted: ${totalDeleted}`);
    }
  }
}
