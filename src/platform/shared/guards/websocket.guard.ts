import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';

// Ports
import { AccountPort } from 'src/domain/ports/outbound/account.port';
import { QuotaPort } from 'src/domain/ports/outbound/quota.port';

// Entities
import { Account } from 'src/domain/entities/account.entity';
import { Quota } from 'src/domain/entities/quota.entity';

// Constants
import { Session } from '../constants/account/auth';
import { ApiKeyStatus } from 'src/platform/shared/constants/status/apikey';
import { Roles } from '../constants/account/roles';

// Helpers
import { SocketHelper } from '../helpers/socket.helper';

@Injectable()
export class WebsocketGuard {
  private readonly logger = new Logger(WebsocketGuard.name);

  constructor(
    private readonly accountPort: AccountPort,
    private readonly quotaPort: QuotaPort,
  ) {}

  /**
   * @description
   * Verifies the client's API key from socket handshake headers.
   * @param client Socket client
   * @param mode 'private' disconnects invalid clients
   *             'public' allows connection even if API key is missing/invalid
   * @returns AuthPayload if valid, otherwise null
   */
  async verifyApiKey(
    client: Socket,
    mode: 'public' | 'private' = 'private',
  ): Promise<Session | null> {
    try {
      const apiKey = client.handshake.headers['x-media-key'] as
        | string
        | undefined;

      if (!apiKey) {
        if (mode === 'private') {
          this.logger.warn(
            `Client ${client.id} attempted private connection without API key`,
          );
          SocketHelper.disconnect(client, 'Missing API key');
        } else {
          this.logger.log(
            `Client ${client.id} connected to public namespace without API key`,
          );
          client.data.user = null;
        }
        return null;
      }

      // Find account
      const account: Account | null =
        await this.accountPort.findByApiKey(apiKey);
      if (!account) throw new Error('Invalid API key');

      // Check status
      if (account.status !== ApiKeyStatus.ACTIVE)
        throw new Error('Inactive API key');

      // Increment quota
      const quota: Quota = await this.quotaPort.findByAccountId(account.id);
      quota.totalRequests += 1;
      await this.quotaPort.save(quota);

      // Attach user info
      const payload: Session = {
        sub: String(account.id),
        role: account.role ?? Roles.USER,
      };
      client.data.user = payload;

      return payload;
    } catch (err) {
      if (mode === 'private') {
        this.logger.warn(
          `Client ${client.id} failed API key verification: ${err.message}`,
        );
        SocketHelper.disconnect(client, 'Invalid API key');
      } else {
        this.logger.log(
          `Client ${client.id} connected to public namespace with invalid API key`,
        );
        client.data.user = null;
      }
      return null;
    }
  }
}
