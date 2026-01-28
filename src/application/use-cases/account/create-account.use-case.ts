import { Injectable } from '@nestjs/common';

//  Inbound
import { CreateAccountPort } from '@/src/domain/ports/inbound/account/create-account.port';

//  Outbound
import { AccountPort } from 'src/domain/ports/outbound/account.port';
import { QuotaPort } from 'src/domain/ports/outbound/quota.port';

//  Dtos
import { CreateAccountDto } from 'src/application/dto/input/account/create-account.dto';

//  Helpers
import { FileHelper } from 'src/platform/shared/helpers/file.helper';
import { KeyHelper } from 'src/platform/shared/helpers/key.helper';

//  Constants
import { Roles } from '@/src/platform/shared/constants/account/roles';

//  i18n
import { I18nService } from 'nestjs-i18n';

//  Errors
import { AccountAlreadyExistsError } from '@/src/platform/shared/errors/account.errors';

@Injectable()
export class CreateAccountUseCase extends CreateAccountPort {
  constructor(
    private readonly accountPort: AccountPort,
    private readonly quotaPort: QuotaPort,
    private readonly i18n: I18nService,
  ) {
    super();
  }

  async execute(
    dto: CreateAccountDto,
  ): Promise<{ message: string; apikey: string }> {
    //  Validate domain uniqueness
    const existing = await this.accountPort.findByDomain(dto.domain);
    if (existing) throw new AccountAlreadyExistsError(this.i18n);

    // Generate sanitized folder and storagePath
    const { folder, storagePath } = FileHelper.generateFolder(dto.domain);

    // Ensure folder exists on disk
    FileHelper.ensureFolder(storagePath);

    // Generate API key
    const apikey = KeyHelper.generate();

    // Create account entity
    const account = await this.accountPort.create({
      apikey: apikey,
      name: dto.name,
      domain: dto.domain,
      folder: folder,
      storagePath: storagePath,
      role: Roles.USER,
    });

    await this.quotaPort.create(account.id);

    return {
      message: this.i18n.t('account.createdSucessfully'),
      apikey: apikey,
    };
  }
}
