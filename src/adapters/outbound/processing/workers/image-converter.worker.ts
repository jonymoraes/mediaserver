import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { DateHelper } from '@/src/platform/shared/helpers/date.helper';

//  Dtos
import { QuotaToDto } from '@/src/application/dto/to-dto/quota.to-dto';

//  Ports
import { ImagePort } from '@/src/domain/ports/outbound/image.port';
import { AccountPort } from '@/src/domain/ports/outbound/account.port';
import { QuotaPort } from '@/src/domain/ports/outbound/quota.port';

//  Helpers
import { FileHelper } from '@/src/platform/shared/helpers/file.helper';

//  Constants
import { JobStatus } from '@/src/platform/shared/constants/messaging';
import { MediaStatus } from '@/src/platform/shared/constants/status/media';
import { Context, Sizes } from '@/src/platform/shared/constants/media/image';

//  Errors
import { AccountNotFoundError } from '@/src/platform/shared/errors/account.errors';
import { QuotaNotFoundError } from '@/src/platform/shared/errors/quota.errors';
import {
  JobNotFoundError,
  JobFailedError,
  JobCanceledError,
} from '@/src/platform/shared/errors/job.erorrs';

// i18n
import { I18nService } from 'nestjs-i18n';

//  Websockets
import { QuotaGateway } from '@/src/adapters/inbound/websockets/quota.gateway';

@Injectable()
@Processor('image-processing')
export class ImageConverterWorker extends WorkerHost {
  private readonly logger = new Logger(ImageConverterWorker.name);

  constructor(
    private readonly imagePort: ImagePort,
    private readonly accountPort: AccountPort,
    private readonly quotaPort: QuotaPort,
    private readonly quotaGateway: QuotaGateway,
    private readonly i18n: I18nService,
  ) {
    super();
  }

  async process(job: Job) {
    let cancel = false; //  Cancel flag

    //  Validate existing job
    if (!job.id) throw new JobNotFoundError(this.i18n);

    //  Get job data
    const jobId = job.id.toString();
    const { filename, filepath, filesize, context, accountId, quotaId } =
      job.data;

    //  Validate job data
    if (!filepath || !filesize || !accountId || !quotaId)
      throw new JobFailedError(this.i18n);

    //  Get quota
    const quota = await this.quotaPort.findById(quotaId);
    if (!quota) throw new QuotaNotFoundError(this.i18n);

    //  Update transferred bytes
    quota.transferredBytes = (
      BigInt(quota.transferredBytes || 0) + BigInt(filesize)
    ).toString();

    //  Save updated quota
    await this.quotaPort.save(quota);

    //  Check job canceled
    const currentJob = await this.imagePort.getImageJob(jobId);
    if (currentJob?.status === JobStatus.CANCELED) cancel = true;

    //  Mark as processing
    await this.imagePort.markImageJobProcessing(jobId);

    //  Progress
    const onProgress = async (percentage: number, stage: string) => {
      const updatedMeta = await this.imagePort.getImageJob(jobId);
      if (updatedMeta?.status === JobStatus.CANCELED) cancel = true;
      await job.updateProgress({ percentage, stage }).catch(() => {});
    };

    try {
      await onProgress(10, this.i18n.translate('job.processing'));

      //  Get account
      const account = await this.accountPort.findById(accountId);
      if (!account) throw new AccountNotFoundError(this.i18n);
      await onProgress(30, this.i18n.t('job.validated'));

      //  Get dimensions
      const { width, height } = Sizes[context] || Sizes[Context.GENERIC];
      await onProgress(50, this.i18n.t('job.preparing'));

      //  Convert and resize
      await FileHelper.converter(
        filepath,
        width,
        height,
        'contain',
        100,
        cancel,
      );
      await onProgress(70, this.i18n.t('job.executing'));

      //  Get filesize after conversion
      const { size: convertedFilesize } = await fs.stat(filepath);

      //  Generate url
      const url = `${process.env.STATIC}/${account.folder}/${filename}`;
      await onProgress(90, this.i18n.t('job.finalizing'));

      //  Create image entry
      const image = await this.imagePort.create({
        filename,
        mimetype: 'image/webp',
        filesize: convertedFilesize.toString(),
        status: MediaStatus.TEMPORARY,
        accountId,
        quotaId,
        expiresAt: DateHelper.fromNow('1d'),
      });

      //  Save image entry
      await this.imagePort.save(image);

      //  Update account's used bytes
      account.usedBytes = (
        BigInt(account.usedBytes || 0) + BigInt(convertedFilesize)
      ).toString();

      //  Save account changes
      await this.accountPort.save(account);
      await onProgress(100, this.i18n.t('job.completed_successfully'));

      //  Emit quota event
      this.quotaGateway.emitQuota(QuotaToDto.fromEntity(quota));

      return { job: jobId, url };
    } catch (err) {
      //  Canceled by user
      if ((err as Error).message === 'Canceled') {
        this.logger.warn(this.i18n.t('job.canceled'));
        await FileHelper.cleanup(filepath, undefined, this.logger);
        throw new JobCanceledError(this.i18n);
      }

      // Failed job → cleanup
      await FileHelper.cleanup(filepath, undefined, this.logger);
      throw new JobFailedError(this.i18n);
    }
  }
}
