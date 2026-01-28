import { Injectable } from '@nestjs/common';

//  Inbound
import { GetAccountsPort } from 'src/domain/ports/inbound/account/get-accounts.port';

//  Outbound
import { AccountPort } from 'src/domain/ports/outbound/account.port';

//  Dtos
import { AccountWithQuotasToDto } from '../../dto/to-dto/account-with-quotas.to-dto';

//  Constants
import {
  PaginatedResult,
  buildPagination,
} from '@/src/platform/shared/constants/pagination';

@Injectable()
export class GetAccountsUseCase extends GetAccountsPort {
  constructor(private readonly accountPort: AccountPort) {
    super();
  }

  /**
   * @description Get paginated accounts including quotas
   * @param page Page number (1-based)
   * @param limit Items per page
   * @returns PaginatedResult<AccountWithQuotasToDto>
   */
  async execute(
    page = 1,
    limit = 10,
  ): Promise<PaginatedResult<AccountWithQuotasToDto>> {
    //  Calculate offset
    const skip = (page - 1) * limit;

    //  Query total count
    const totalItems = (await this.accountPort.count?.()) ?? 0;

    //  Query accounts with quotas loaded
    const accounts = await this.accountPort.findAll?.({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const items =
      accounts?.map((account) => AccountWithQuotasToDto.fromEntity(account)) ??
      [];

    const meta = buildPagination(totalItems, page, limit);

    return { items, meta };
  }
}
