import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

//  Dtos
import { QuotaToDto } from '../../dto/to-dto/quota.to-dto';

//  Inbound
import { DeleteVideoPort } from '@/src/domain/ports/inbound/video/delete-video.port';

//  Outbound
import { AccountPort } from 'src/domain/ports/outbound/account.port';
import { VideoPort } from 'src/domain/ports/outbound/video.port';
import { QuotaPort } from '@/src/domain/ports/outbound/quota.port';

//  Errors
import { AccountNotFoundError } from '@/src/platform/shared/errors/account.errors';
import { ImageNotFoundError } from '@/src/platform/shared/errors/image.errors';

//  i18n
import { I18nService } from 'nestjs-i18n';

//  Gateway
import { QuotaGateway } from '@/src/adapters/inbound/websockets/quota.gateway';

@Injectable()
export class DeleteVideoUseCase extends DeleteVideoPort {
  constructor(
    private readonly accountPort: AccountPort,
    private readonly videoPort: VideoPort,
    private readonly quotaPort: QuotaPort,
    private readonly quotaGateway: QuotaGateway,
    private readonly i18n: I18nService,
  ) {
    super();
  }

  async execute(
    userId: string,
    filename: string,
  ): Promise<{ message: string }> {
    //  Validate filename
    if (!filename) throw new ImageNotFoundError(this.i18n);

    //  Get account
    const account = await this.accountPort.findById(userId);
    if (!account) throw new AccountNotFoundError(this.i18n);
    if (!account.storagePath) throw new AccountNotFoundError(this.i18n);

    //  Delete physical file
    const filepath = join(account.storagePath, filename);
    try {
      await fs.unlink(filepath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') throw err;
    }

    //  Get image
    const video = await this.videoPort.findByFilename(filename, account.id);
    if (!video) throw new ImageNotFoundError(this.i18n);

    //  Update usedBytes
    account.usedBytes = (
      Number(account.usedBytes) - Number(video.filesize)
    ).toString();
    await this.accountPort.save(account);

    //  Delete image
    await this.videoPort.delete(video.id);

    //  Emit quota updates
    const quota = await this.quotaPort.findByAccountId(account.id);
    if (quota) this.quotaGateway.emitQuota(QuotaToDto.fromEntity(quota));

    return { message: this.i18n.t('video.deletedSuccessfully') };
  }
}
