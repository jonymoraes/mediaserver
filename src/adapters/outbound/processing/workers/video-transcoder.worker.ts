import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { promises as fs, existsSync } from 'fs';
import { join, basename, extname, dirname } from 'path';

//  Ports
import { VideoPort } from '@/src/domain/ports/outbound/video.port';
import { AccountPort } from '@/src/domain/ports/outbound/account.port';
import { QuotaPort } from '@/src/domain/ports/outbound/quota.port';

//  Helpers
import { ValidationHelper } from '@/src/platform/shared/helpers/validation.helper';
import { FileHelper } from '@/src/platform/shared/helpers/file.helper';
import { DateHelper } from '@/src/platform/shared/helpers/date.helper';
import { NamingHelper } from '@/src/platform/shared/helpers/naming.helper';
import { TranscodeHelper } from '@/src/platform/shared/helpers/transcode.helper';

//  Dtos
import { QuotaToDto } from '@/src/application/dto/to-dto/quota.to-dto';

//  Constants
import { JobStatus } from '@/src/platform/shared/constants/messaging';
import { MediaStatus } from '@/src/platform/shared/constants/status/media';
import { Codecs, Format } from '@/src/platform/shared/constants/media/video';

//  Errors
import { AccountNotFoundError } from '@/src/platform/shared/errors/account.errors';
import { QuotaNotFoundError } from '@/src/platform/shared/errors/quota.errors';
import {
  JobNotFoundError,
  JobFailedError,
  JobCanceledError,
} from '@/src/platform/shared/errors/job.erorrs';

//  i18n
import { I18nService } from 'nestjs-i18n';

//  Websockets
import { QuotaGateway } from '@/src/adapters/inbound/websockets/quota.gateway';

@Injectable()
@Processor('video-processing')
export class VideoTranscoderWorker extends WorkerHost {
  private readonly logger = new Logger(VideoTranscoderWorker.name);

  constructor(
    private readonly videoPort: VideoPort,
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
    const {
      filename,
      filepath,
      filesize,
      mimetype,
      format,
      accountId,
      quotaId,
    } = job.data;

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

    //  Check if job was canceled
    const currentJob = await this.videoPort.getVideoJob(jobId);
    if (currentJob?.status === JobStatus.CANCELED) cancel = true;

    //  Mark job as processing
    await this.videoPort.markVideoJobProcessing(jobId);

    //  Progress
    const onProgress = async (percentage: number, stage: string) => {
      const updatedMeta = await this.videoPort.getVideoJob(jobId);
      if (updatedMeta?.status === JobStatus.CANCELED) cancel = true;
      await job.updateProgress({ percentage, stage }).catch(() => {});
    };

    //  Get target extension
    const targetExt = `.${format.toLowerCase()}`;
    const baseName = basename(filename, extname(filename));

    //  Sanitize filename
    const candidateName = NamingHelper.sanitizeFilename(
      `${baseName}${targetExt}`,
    );

    //  Generate output name
    const outputName = NamingHelper.getAvailableFilename(
      dirname(filepath),
      candidateName,
    );

    //  Generate output path
    const outputPath = join(dirname(filepath), outputName);

    try {
      await onProgress(5, this.i18n.t('job.starting'));

      //  Validate file
      if (!ValidationHelper.isVideo(filename, mimetype))
        throw new BadRequestException(
          `${this.i18n.t('video.invalid')}: ${filename}`,
        );
      await onProgress(10, this.i18n.t('job.validating'));

      //  Get codecs
      const { videoCodec, audioCodec } = Codecs[format as Format];

      //  Get duration
      const duration = await TranscodeHelper.getDuration(
        filepath,
        'VideoTranscoderWorker',
      );
      await onProgress(15, this.i18n.t('job.preparing'));

      //  Transcode video
      await TranscodeHelper.transcodeVideo({
        input: filepath,
        output: outputPath,
        videoCodec,
        audioCodec,
        duration,
        loggerName: 'VideoTranscoderWorker',
        onProgress: (p, stage) => void onProgress(p, stage),
        onCancel: () => {
          if (!cancel) return false;

          // Remove partial output if canceled
          if (existsSync(outputPath)) {
            fs.unlink(outputPath).catch(() => {
              this.logger.warn(
                `${this.i18n.t('common.failed_deletion')}: ${outputPath}`,
              );
            });
          }

          return true;
        },
      });

      //  Delete original file
      if (outputPath !== filepath && existsSync(filepath))
        await fs.unlink(filepath);
      await onProgress(82, this.i18n.t('job.executing'));

      //  Get transcoded filesize
      const { size: transcodedFilesize } = await fs.stat(outputPath);

      //  Get account
      const account = await this.accountPort.findById(accountId);
      if (!account) throw new AccountNotFoundError(this.i18n);

      //  Get output mimetype
      const outputMimetype = FileHelper.getMimeType(format);

      //  Get relative path
      const relativePath = outputPath.split(`${process.env.PUBLIC_DIR}/`).pop();

      //  Generate url
      const url = `${process.env.STATIC}/${account.folder}/${basename(relativePath!)}`;

      await onProgress(90, this.i18n.t('job.finalizing'));
      //  Create video entry
      const video = await this.videoPort.create({
        filename: basename(outputPath),
        mimetype: outputMimetype,
        filesize: transcodedFilesize.toString(),
        status: MediaStatus.TEMPORARY,
        accountId,
        quotaId,
        expiresAt: DateHelper.fromNow('1d'),
      });

      //  Save video entry
      await this.videoPort.save(video);

      //  Update used bytes
      account.usedBytes = (
        BigInt(account.usedBytes || 0) + BigInt(transcodedFilesize)
      ).toString();

      //  Emit quota event
      this.quotaGateway.emitQuota(QuotaToDto.fromEntity(quota));

      //  Save account changes
      await this.accountPort.save(account);
      await onProgress(100, this.i18n.t('job.completed_successfully'));

      return { job: jobId, url };
    } catch (err) {
      //  Canceled by user
      if ((err as Error).message === 'Canceled') {
        this.logger.warn(this.i18n.t('job.canceled'));
        await FileHelper.cleanup(filepath, outputPath, this.logger);
        throw new JobCanceledError(this.i18n);
      }

      //  Failed job → cleanup
      await FileHelper.cleanup(filepath, outputPath, this.logger);

      this.logger.error(
        `${this.i18n.t('job.failed')}: ${(err as Error).message}`,
      );
      throw new JobFailedError(this.i18n);
    }
  }
}
