import { Account } from 'src/domain/entities/account.entity';
import { QuotaToDto } from './quota.to-dto';

//  Constants
import { Roles } from 'src/platform/shared/constants/account/roles';
import { ApiKeyStatus } from 'src/platform/shared/constants/status/apikey';

export class AccountWithQuotasToDto {
  id: string;
  name: string;
  domain?: string;
  folder?: string;
  storagePath?: string;
  usedBytes: number;
  role: Roles;
  status: ApiKeyStatus;
  createdAt: Date;
  updatedAt: Date;
  quotas?: QuotaToDto[];

  /**
   * @description Map Account entity + quotas to DTO
   */
  static fromEntity(account: Account): AccountWithQuotasToDto {
    const dto = new AccountWithQuotasToDto();
    dto.id = account.id;
    dto.name = account.name;
    dto.domain = account.domain;
    dto.folder = account.folder;
    dto.storagePath = account.storagePath;
    dto.usedBytes = Number(account.usedBytes);
    dto.role = account.role;
    dto.status = account.status;
    dto.createdAt = account.createdAt;
    dto.updatedAt = account.updatedAt;

    dto.quotas = account.quotas?.map((q) => QuotaToDto.fromEntity(q)) ?? [];

    return dto;
  }
}
