import { Injectable } from '@nestjs/common';

//  Inbound
import { UpdateAccountPort } from '@/src/domain/ports/inbound/account/update-account.port';

//  Outbound
import { AccountPort } from 'src/domain/ports/outbound/account.port';

//  Dtos
import { UpdateAccountDto } from 'src/application/dto/input/account/update-account.dto';

//  Helpers
import { FileHelper } from 'src/platform/shared/helpers/file.helper';

//  Errors
import { AccountAlreadyExistsError } from '@/src/platform/shared/errors/account.errors';
import { AccountNotFoundError } from '@/src/platform/shared/errors/account.errors';

//  i18n
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class UpdateAccountUseCase extends UpdateAccountPort {
  constructor(
    private readonly accountPort: AccountPort,
    private readonly i18n: I18nService,
  ) {
    super();
  }

  async execute(
    accountId: string,
    dto: UpdateAccountDto,
  ): Promise<{ message: string }> {
    const account = await this.accountPort.findById(accountId);
    if (!account) throw new AccountNotFoundError(this.i18n);

    let folder = account.folder;
    let storagePath = account.storagePath;

    // Domain change → validate uniqueness + rename folder
    if (dto.domain && dto.domain !== account.domain) {
      const existing = await this.accountPort.findByDomain(dto.domain);
      if (existing) throw new AccountAlreadyExistsError(this.i18n);

      const newPaths = FileHelper.generateFolder(dto.domain);

      // Rename folder on disk (atomic)
      if (account.storagePath) {
        FileHelper.renameFolder(account.storagePath, newPaths.storagePath);
      } else {
        FileHelper.ensureFolder(newPaths.storagePath);
      }

      folder = newPaths.folder;
      storagePath = newPaths.storagePath;
    }

    // Persist changes
    await this.accountPort.update(account.id, {
      name: dto.name ?? account.name,
      domain: dto.domain ?? account.domain,
      folder,
      storagePath,
    });

    return { message: this.i18n.t('account.updatedSucessfully') };
  }
}
