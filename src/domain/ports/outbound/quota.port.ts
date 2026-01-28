/**
 * @file quota.port.ts
 * @description Outbound port for Quota persistence and cache handling
 */

import { Quota } from 'src/domain/entities/quota.entity';

export abstract class QuotaPort {
  /**
   * @description Find quota by id
   * @param id
   */
  abstract findById(id: string): Promise<Quota | null>;

  /**
   * @description Find current month quota by accountId
   * If it does not exist, it must be created
   * @param accountId
   */
  abstract findByAccountId(accountId: string): Promise<Quota>;

  /**
   * @description Create current month quota for account
   * @param accountId
   */
  abstract create(accountId: string): Promise<Quota>;

  /**
   * @description Save quota (insert or update)
   * @param quota
   */
  abstract save(quota: Quota): Promise<Quota>;

  /**
   * @description Delete quota by id
   * @param id
   */
  abstract delete(id: string): Promise<boolean>;
}
