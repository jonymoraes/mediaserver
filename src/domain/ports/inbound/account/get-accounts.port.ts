import { AccountWithQuotasToDto } from '@/src/application/dto/to-dto/account-with-quotas.to-dto';
import { PaginatedResult } from '@/src/platform/shared/constants/pagination';

/**
 * @description Inbound port for getting paginated accounts including quotas
 */
export abstract class GetAccountsPort {
  /**
   * @description Get paginated accounts
   * @param page Page number (1-based)
   * @param limit Items per page
   */
  abstract execute(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<AccountWithQuotasToDto>>;
}
