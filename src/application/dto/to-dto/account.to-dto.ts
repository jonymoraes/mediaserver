import { Account } from 'src/domain/entities/account.entity';

//  Constants
import { Roles } from 'src/platform/shared/constants/account/roles';
import { ApiKeyStatus } from 'src/platform/shared/constants/status/apikey';

export class AccountToDto {
  id: string;
  name: string;
  domain?: string;
  folder?: string;
  storagePath?: string;
  role: Roles;
  status: ApiKeyStatus;
  createdAt: Date;
  updatedAt: Date;

  /**
   * @description Map Account entity to DTO
   * @param account Account
   * @returns AccountToDto
   */
  static fromEntity(account: Account): AccountToDto {
    const dto = new AccountToDto();
    dto.id = account.id;
    dto.name = account.name;
    dto.domain = account.domain;
    dto.folder = account.folder;
    dto.storagePath = account.storagePath;
    dto.role = account.role;
    dto.status = account.status;
    dto.createdAt = account.createdAt;
    dto.updatedAt = account.updatedAt;
    return dto;
  }
}
