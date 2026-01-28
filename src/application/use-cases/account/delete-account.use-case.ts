import { Injectable } from '@nestjs/common';

// Inbound
import { DeleteAccountPort } from '@/src/domain/ports/inbound/account/delete-account.port';

// Outbound
import { AccountPort } from 'src/domain/ports/outbound/account.port';

// Helpers
import { FileHelper } from 'src/platform/shared/helpers/file.helper';

// Errors
import { AccountNotFoundError } from '@/src/platform/shared/errors/account.errors';

//  i18n
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class DeleteAccountUseCase extends DeleteAccountPort {
  constructor(
    private readonly accountPort: AccountPort,
    private readonly i18n: I18nService,
  ) {
    super();
  }

  /**
   * @description Delete account by id
   */
  async execute(accountId: string): Promise<{ message: string }> {
    const account = await this.accountPort.findById(accountId);
    if (!account) throw new AccountNotFoundError(this.i18n);

    // Delete folder if exists
    if (account.storagePath) {
      FileHelper.removeFolder(account.storagePath);
    }

    // Delete account from DB + Redis cache
    const deleted = await this.accountPort.delete(accountId);
    if (!deleted) throw new AccountNotFoundError(this.i18n);

    return { message: this.i18n.t('account.deletedSuccesfully') };
  }
}
