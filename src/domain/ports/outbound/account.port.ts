import { Account } from 'src/domain/entities/account.entity';
/**
 * @description Account outbound port
 */
export abstract class AccountPort {
  /**
   * @description Count total accounts
   */
  abstract count(): Promise<number>;

  /**
   * @description Find all accounts with optional pagination and ordering
   * @param skip?
   * @param take?
   * @param order?
   */
  abstract findAll(options?: {
    skip?: number;
    take?: number;
    order?: Record<string, 'ASC' | 'DESC'>;
  }): Promise<Account[]>;

  /**
   * @description Find account by id
   * @param id
   */
  abstract findById(id: string): Promise<Account | null>;

  /**
   * @description Find account by domain
   * @param domain
   */
  abstract findByDomain(domain: string): Promise<Account | null>;

  /**
   * @description Find account by folder
   * @param folder
   */
  abstract findByFolder(folder: string): Promise<Account | null>;

  /**
   * @description Find account by apikey
   * @param apikey
   */
  abstract findByApiKey(apikey: string): Promise<Account | null>;

  /**
   * @description Create a new account
   * @param data
   */
  abstract create(data: Partial<Account>): Promise<Account>;

  /**
   * @description Update account partially by id
   * @param id
   * @param data
   */
  abstract update(id: string, data: Partial<Account>): Promise<Account | null>;

  /**
   * @description Save account (insert or update)
   * @param account
   */
  abstract save(account: Account): Promise<Account>;

  /**
   * @description Delete account by id
   * @param id
   */
  abstract delete(id: string): Promise<boolean>;
}
