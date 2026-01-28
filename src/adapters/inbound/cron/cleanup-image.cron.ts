import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { promises as fs } from 'fs';

//  Dtos
import { QuotaToDto } from '@/src/application/dto/to-dto/quota.to-dto';

//  Entities
import { Image } from '@/src/domain/entities/image.entity';

//  Port
import { ImagePort } from '@/src/domain/ports/outbound/image.port';

//  Websockets
import { QuotaGateway } from '../websockets/quota.gateway';

@Injectable()
export class CleanupImageCron {
  private readonly logger = new Logger(CleanupImageCron.name);

  constructor(
    private readonly imagePort: ImagePort,
    private readonly quotaGateway: QuotaGateway,
  ) {}

  @Cron(CronExpression.EVERY_3_HOURS)
  async cleanup(batchSize = 100) {
    this.logger.log('Starting image cleanup job...');

    let totalDeleted = 0;

    while (true) {
      const batch: Image[] = await this.imagePort.findExpired(batchSize);
      if (!batch.length) break;

      await Promise.all(
        batch.map(async (img) => {
          try {
            const quota = img.quota;
            const account = img.account;
            if (!account || !quota || !account.storagePath) return;

            //  Delete physical file
            if (img.account?.storagePath) {
              await fs.unlink(img.account?.storagePath).catch(() => {});
            }

            //  Delete image from database
            await this.imagePort.delete(img.id);

            //  Update quota
            account.usedBytes = (
              BigInt(account.usedBytes) - BigInt(img.filesize)
            ).toString();

            //  Emit changes
            this.quotaGateway.emitQuota(QuotaToDto.fromEntity(quota));

            totalDeleted++;
          } catch (err) {
            this.logger.error(
              `Failed to delete image ${img.id}: ${err.message}`,
            );
          }
        }),
      );

      this.logger.log(`Image cleanup finished. Total deleted: ${totalDeleted}`);
    }
  }
}
