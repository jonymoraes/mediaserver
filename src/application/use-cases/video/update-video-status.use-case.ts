import { Injectable } from '@nestjs/common';

//  Inbound
import { UpdateVideoStatusPort } from '@/src/domain/ports/inbound/video/update-video-status.port';

//  Outbound
import { AccountPort } from 'src/domain/ports/outbound/account.port';
import { VideoPort } from 'src/domain/ports/outbound/video.port';

//  Constants
import { MediaStatus } from '@/src/platform/shared/constants/status/media';

//  Errors
import { AccountNotFoundError } from '@/src/platform/shared/errors/account.errors';
import { ImageNotFoundError } from '@/src/platform/shared/errors/image.errors';

//  i18n
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class UpdateVideoStatusUseCase extends UpdateVideoStatusPort {
  constructor(
    private readonly accountPort: AccountPort,
    private readonly videoPort: VideoPort,
    private readonly i18n: I18nService,
  ) {
    super();
  }

  async execute(
    userId: string,
    filename: string,
  ): Promise<{ message: string }> {
    //  Get account
    const account = await this.accountPort.findById(userId);
    if (!account) throw new AccountNotFoundError(this.i18n);

    //  Get image
    const video = await this.videoPort.findByFilename(filename, account.id);
    if (!video) throw new ImageNotFoundError(this.i18n);

    //  Update image status and expiration
    video.status = MediaStatus.ACTIVE;
    video.expiresAt = undefined;
    await this.videoPort.save(video);

    return { message: this.i18n.t('video.activatedSuccessfully') };
  }
}
