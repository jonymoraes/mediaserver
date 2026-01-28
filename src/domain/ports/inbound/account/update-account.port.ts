import { UpdateAccountDto } from '@/src/application/dto/input/account/update-account.dto';

/**
 * @description Inbound port for updating accounts
 */
export abstract class UpdateAccountPort {
  /**
   * @description Updates account mutable fields (name/domain)
   * @param accountId Account id
   * @param dto UpdateAccountDto
   */
  abstract execute(
    accountId: string,
    dto: UpdateAccountDto,
  ): Promise<{ message: string }>;
}
