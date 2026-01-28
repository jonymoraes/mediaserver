import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

//  Ports
import { AccountPort } from 'src/domain/ports/outbound/account.port';
import { QuotaPort } from 'src/domain/ports/outbound/quota.port';

//  Entities
import { Quota } from 'src/domain/entities/quota.entity';
import { Account } from 'src/domain/entities/account.entity';

//  Constants
import { AuthRequest } from '../constants/account/auth';
import { ApiKeyStatus } from 'src/platform/shared/constants/status/apikey';
import { Roles } from '../constants/account/roles';

// Errors
import {
  ApiKeyInvalidError,
  ApiKeyInactiveError,
  ApiKeyNotProvidedError,
} from '../errors/common.errors';

//  i18n
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class AuthenticateGuard implements CanActivate {
  constructor(
    private readonly accountPort: AccountPort,
    private readonly quotaPort: QuotaPort,
    private readonly i18n: I18nService,
  ) {}

  /**
   * @description
   * Guard that authenticates HTTP requests using API keys.
   *
   * Flow:
   * - Reads the API key from `x-media-key` header.
   * - Checks that the key exists and account is active.
   * - Attaches `req.user` with account info.
   * - Updates usage metrics (`totalRequests`) atomically in the current quota.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthRequest>();

    //  Get API key from headers
    const apiKey = req.headers['x-media-key'] as string | undefined;
    if (!apiKey) throw new ApiKeyNotProvidedError(this.i18n);

    try {
      //  Find account by API key
      const account: Account | null =
        await this.accountPort.findByApiKey(apiKey);
      if (!account) throw new ApiKeyInvalidError(this.i18n);

      //  Check status
      if (account.status !== ApiKeyStatus.ACTIVE)
        throw new ApiKeyInactiveError(this.i18n);

      //  Get current month quota
      const quota: Quota = await this.quotaPort.findByAccountId(account.id);

      //  Increment totalRequests
      quota.totalRequests += 1;
      await this.quotaPort.save(quota);

      //  Set user (attach account info)
      req.user = {
        sub: String(account.id),
        role: account.role ?? Roles.USER,
      };

      return true;
    } catch {
      return false;
    }
  }
}
