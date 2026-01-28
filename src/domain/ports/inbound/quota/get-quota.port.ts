import { QuotaToDto } from '@/src/application/dto/to-dto/quota.to-dto';

/**
 * @description Inbound port for getting a quota by ID
 */
export abstract class GetQuotaPort {
  /**
   * @description Get quota by ID
   * @param id Quota id
   */
  abstract execute(id: string): Promise<{ quota: QuotaToDto }>;
}
