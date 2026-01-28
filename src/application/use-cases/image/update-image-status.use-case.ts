import { Injectable } from '@nestjs/common';

//  Inbound
import { UpdateImageStatusPort } from '@/src/domain/ports/inbound/image/update-image-status.port';

//  Outbound
import { AccountPort } from 'src/domain/ports/outbound/account.port';
import { ImagePort } from 'src/domain/ports/outbound/image.port';

//  Constants
import { MediaStatus } from '@/src/platform/shared/constants/status/media';

//  Errors
import { AccountNotFoundError } from '@/src/platform/shared/errors/account.errors';
import { ImageNotFoundError } from '@/src/platform/shared/errors/image.errors';

//  i18n
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class UpdateImageStatusUseCase extends UpdateImageStatusPort {
  constructor(
    private readonly accountPort: AccountPort,
    private readonly imagePort: ImagePort,
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
    const image = await this.imagePort.findByFilename(filename, account.id);
    if (!image) throw new ImageNotFoundError(this.i18n);

    //  Update image status and expiration
    image.status = MediaStatus.ACTIVE;
    image.expiresAt = undefined;
    await this.imagePort.save(image);

    return { message: this.i18n.t('image.activatedSuccessfully') };
  }
}
