import { Quota } from 'src/domain/entities/quota.entity';

export class QuotaToDto {
  id: string;
  accountId: string;
  period: string;
  transferredBytes: number;
  totalRequests: number;
  usedBytes: number;
  createdAt: Date;
  updatedAt: Date;

  /**
   * @description Map Quota entity to DTO
   */
  static fromEntity(quota: Quota): QuotaToDto {
    const dto = new QuotaToDto();
    dto.id = quota.id;
    dto.accountId = quota.accountId;
    dto.period = quota.period;
    dto.transferredBytes = Number(quota.transferredBytes);
    dto.totalRequests = quota.totalRequests;
    dto.usedBytes = quota.account ? Number(quota.account.usedBytes) : 0;
    dto.createdAt = quota.createdAt;
    dto.updatedAt = quota.updatedAt;
    return dto;
  }
}
