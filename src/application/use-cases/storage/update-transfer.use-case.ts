import { Injectable } from '@nestjs/common';

//  Dtos
import { QuotaToDto } from '../../dto/to-dto/quota.to-dto';

//  Inbound Port
import { UpdateTransferPort } from '@/src/domain/ports/inbound/storage/update-transfer.port';

//  Outbound
import { AccountPort } from 'src/domain/ports/outbound/account.port';
import { QuotaPort } from 'src/domain/ports/outbound/quota.port';

//  Errors
import { AccountNotFoundError } from '@/src/platform/shared/errors/account.errors';

//  i18n
import { I18nService } from 'nestjs-i18n';

//  Websockets
import { QuotaGateway } from '@/src/adapters/inbound/websockets/quota.gateway';

@Injectable()
export class UpdateTransferUseCase extends UpdateTransferPort {
  constructor(
    private readonly accountPort: AccountPort,
    private readonly quotaPort: QuotaPort,
    private readonly quotaGateway: QuotaGateway,
    private readonly i18n: I18nService,
  ) {
    super();
  }

  async execute(userId: string, size: number): Promise<void> {
    //  Get account
    const account = await this.accountPort.findById(userId);
    if (!account) throw new AccountNotFoundError(this.i18n);

    //  Get quota
    const quota = await this.quotaPort.findByAccountId(account.id);

    //  Update transferredBytes
    quota.transferredBytes = (
      Number(quota.transferredBytes) + Number(size)
    ).toString();
    await this.quotaPort.save(quota);

    //  Emit quota updates
    this.quotaGateway.emitQuota(QuotaToDto.fromEntity(quota), account.id);
  }
}
