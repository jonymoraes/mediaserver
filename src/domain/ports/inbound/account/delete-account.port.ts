/**
 * @description Inbound port for deleting accounts
 */
export abstract class DeleteAccountPort {
  /**
   * @description Deletes an account by id
   * @param accountId Account id
   */
  abstract execute(accountId: string): Promise<{ message: string }>;
}
