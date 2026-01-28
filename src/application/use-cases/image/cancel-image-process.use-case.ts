import { Injectable } from '@nestjs/common';

//  Inbound
import { CancelImageProcessPort } from 'src/domain/ports/inbound/image/cancel-image-process.port';

//  Outbound
import { AccountPort } from 'src/domain/ports/outbound/account.port';
import { ImagePort } from 'src/domain/ports/outbound/image.port';

//  Constants
import { JobStatus } from 'src/platform/shared/constants/messaging';

//  Errors
import {
  JobNotFoundError,
  JobAlreadyCompletedError,
  JobAlreadyCanceledError,
} from 'src/platform/shared/errors/job.erorrs';

// i18n
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class CancelImageProcessUseCase extends CancelImageProcessPort {
  constructor(
    private readonly accountPort: AccountPort,
    private readonly imagePort: ImagePort,
    private readonly i18n: I18nService,
  ) {
    super();
  }

  async execute(jobId: string): Promise<{ message: string }> {
    //  Get job
    const job = await this.imagePort.getImageJob(jobId);
    if (!job) throw new JobNotFoundError(this.i18n);

    //  Validate already completed
    if (job.status === JobStatus.DONE)
      throw new JobAlreadyCompletedError(this.i18n);

    //  Validate already canceled
    if (job.status === JobStatus.CANCELED)
      throw new JobAlreadyCanceledError(this.i18n);

    //  Cancel job
    job.status = JobStatus.CANCELED;
    await this.imagePort.saveImageJob(job);

    //  Mark job as canceled
    await this.imagePort.markImageJobCanceled(jobId);

    return { message: this.i18n.t('image.canceledSuccessfully') };
  }
}
