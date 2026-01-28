import { WebSocketGateway } from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { WebsocketGuard } from '@/src/platform/shared/guards/websocket.guard';
import { BaseGateway } from '@/src/platform/shared/websockets/base.gateway';
import { QuotaToDto } from '@/src/application/dto/to-dto/quota.to-dto';

@WebSocketGateway({
  namespace: 'quota',
  cors: { origin: '*', credentials: false },
})
@Injectable()
export class QuotaGateway extends BaseGateway {
  constructor(protected readonly guard: WebsocketGuard) {
    super(guard, QuotaGateway.name, 'private');
  }

  /**
   * @description Emit a QuotaToDto to all connected sockets
   * @param quota Quota DTO to emit
   */
  emitQuota(quota: QuotaToDto) {
    if (!quota) return;

    this.socket.toAll().emit('quota-updated', quota);
    this.logger.log(
      `Emitted quota-updated to all connected sockets: ${JSON.stringify(quota)}`,
    );
  }
}
