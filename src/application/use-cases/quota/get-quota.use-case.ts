import { Injectable } from '@nestjs/common';

// Inbound
import { GetQuotaPort } from 'src/domain/ports/inbound/quota/get-quota.port';

// Outbound
import { QuotaPort } from 'src/domain/ports/outbound/quota.port';

// Dto
import { QuotaToDto } from '../../dto/to-dto/quota.to-dto';

@Injectable()
export class GetQuotaUseCase extends GetQuotaPort {
  constructor(private readonly quotaPort: QuotaPort) {
    super();
  }

  /**
   * @description Get current month quota for account
   * @param accountId Account id
   */
  async execute(accountId: string): Promise<{ quota: QuotaToDto }> {
    const quota = await this.quotaPort.findByAccountId(accountId);

    return { quota: QuotaToDto.fromEntity(quota) };
  }
}
