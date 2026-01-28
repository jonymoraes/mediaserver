import { Injectable } from '@nestjs/common';
import { writeFileSync } from 'fs';

//  BullMQ
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

//  Inbound
import { UploadVideoPort } from '@/src/domain/ports/inbound/video/upload-video.port';

//  Outbound
import { AccountPort } from 'src/domain/ports/outbound/account.port';
import { QuotaPort } from 'src/domain/ports/outbound/quota.port';
import { VideoPort } from '@/src/domain/ports/outbound/video.port';

//  Helpers
import { FileHelper } from '@/src/platform/shared/helpers/file.helper';

//  Constants
import { MultipartFile } from '@fastify/multipart';
import { JobStatus } from '@/src/platform/shared/constants/messaging';

//  Errors
import {
  AccountNotFoundError,
  AccountStorageNotFoundError,
} from '@/src/platform/shared/errors/account.errors';
import { JobNotFoundError } from '@/src/platform/shared/errors/job.erorrs';

//  i18n
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class UploadVideoUseCase extends UploadVideoPort {
  constructor(
    private readonly accountPort: AccountPort,
    private readonly quotaPort: QuotaPort,
    private readonly videoPort: VideoPort,
    private readonly i18n: I18nService,

    @InjectQueue('video-processing')
    private readonly videoQueue: Queue,
  ) {
    super();
  }

  /**
   * @description Handles image upload: validates account, quota, saves file and DB entry
   * @param userId User ID from session
   * @param file MultipartFile with buffer
   * @param format Optional video format
   */
  async execute(
    userId: string,
    file: MultipartFile,
    format: string = 'WEBM',
  ): Promise<{ message: string; jobId: string }> {
    //  Get account
    const account = await this.accountPort.findById(userId);
    if (!account) throw new AccountNotFoundError(this.i18n);

    //  Ensure account folder/storagePath exists on disk
    if (!account.storagePath) throw new AccountStorageNotFoundError(this.i18n);

    FileHelper.ensureFolder(account.storagePath);

    //  Get quota
    const quota = await this.quotaPort.findByAccountId(account.id);

    //  Prepare file path
    const { filePath, finalName } = FileHelper.prepareUploadFilepath(
      account.storagePath,
      file.filename,
    );

    //  Write file to disk
    writeFileSync(filePath, (file as any).buffer);

    //  Get file size
    const sizeInBytes = (file as any).buffer.length;

    //  Add job to queue
    const job = await this.videoQueue.add('process-video', {
      filename: finalName,
      filepath: filePath,
      mimetype: file.mimetype,
      filesize: sizeInBytes,
      format: format,
      accountId: account.id,
      quotaId: quota.id,
    });

    //  Ensure job ID
    if (!job.id) throw new JobNotFoundError(this.i18n);
    const jobId = String(job.id);

    //  Save metadata in Redis
    await this.videoPort.saveVideoJob({
      jobId,
      status: JobStatus.PENDING,
      filename: finalName,
      filepath: filePath,
      mimetype: file.mimetype,
      filesize: sizeInBytes,
      format: format,
      accountId: account.id,
      quotaId: quota.id,
    });

    return { message: this.i18n.t('video.onQueue'), jobId };
  }
}
