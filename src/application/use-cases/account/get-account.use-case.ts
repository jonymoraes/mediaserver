import { Injectable } from '@nestjs/common';

// Inbound
import { GetAccountPort } from '@/src/domain/ports/inbound/account/get-account.port';

// Outbound
import { AccountPort } from 'src/domain/ports/outbound/account.port';

// Dto
import { AccountToDto } from '../../dto/to-dto/account.to-dto';

// Errors
import { AccountNotFoundError } from '@/src/platform/shared/errors/account.errors';

//  i18n
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class GetAccountUseCase extends GetAccountPort {
  constructor(
    private readonly accountPort: AccountPort,
    private readonly i18n: I18nService,
  ) {
    super();
  }

  /**
   * @description Get account by ID
   */
  async execute(accountId: string): Promise<{ account: AccountToDto }> {
    const account = await this.accountPort.findById(accountId);
    if (!account) throw new AccountNotFoundError(this.i18n);

    return { account: AccountToDto.fromEntity(account) };
  }
}
