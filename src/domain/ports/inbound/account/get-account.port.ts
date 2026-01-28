import { AccountToDto } from '@/src/application/dto/to-dto/account.to-dto';

/**
 * @description Inbound port for getting an account by ID
 */
export abstract class GetAccountPort {
  /**
   * @description Get account by ID
   * @param accountId Account id
   */
  abstract execute(accountId: string): Promise<{ account: AccountToDto }>;
}
