import { Injectable, NotFoundException } from '@nestjs/common';

//  Inbound
import { CancelVideoProcessPort } from '@/src/domain/ports/inbound/video/cancel-video-process.port';

//  Outbound
import { AccountPort } from 'src/domain/ports/outbound/account.port';
import { VideoPort } from 'src/domain/ports/outbound/video.port';

//  Constants
import { JobStatus } from 'src/platform/shared/constants/messaging';

//  Errors
import {
  JobNotFoundError,
  JobAlreadyCompletedError,
  JobAlreadyCanceledError,
} from 'src/platform/shared/errors/job.erorrs';

//  i18n
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class CancelVideoProcessUseCase extends CancelVideoProcessPort {
  constructor(
    private readonly accountPort: AccountPort,
    private readonly videoPort: VideoPort,
    private readonly i18n: I18nService,
  ) {
    super();
  }

  async execute(jobId: string): Promise<{ message: string }> {
    //  Get job
    const job = await this.videoPort.getVideoJob(jobId);
    if (!job) throw new JobNotFoundError(this.i18n);

    //  Validate already completed
    if (job.status === JobStatus.DONE)
      throw new JobAlreadyCompletedError(this.i18n);

    //  Validate already canceled
    if (job.status === JobStatus.CANCELED)
      throw new JobAlreadyCanceledError(this.i18n);

    //  Cancel job
    job.status = JobStatus.CANCELED;
    await this.videoPort.saveVideoJob(job);

    //  Mark job as canceled
    await this.videoPort.markVideoJobCanceled(jobId);

    return { message: this.i18n.t('video.canceledSuccessfully') };
  }
}
