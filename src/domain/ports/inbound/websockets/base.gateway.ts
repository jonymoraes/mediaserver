import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { Logger } from '@nestjs/common';

import { WebsocketGuard } from '@/src/platform/shared/guards/websocket.guard';
import { SocketHelper } from '@/src/platform/shared/helpers/socket.helper';

export abstract class BaseGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  protected readonly usersMap: Map<string, Set<Socket>> = new Map();
  protected readonly logger: Logger;
  protected readonly mode: 'public' | 'private';

  @WebSocketServer()
  protected server: Server;

  constructor(
    protected readonly guard: WebsocketGuard,
    gatewayName: string,
    mode: 'public' | 'private' = 'private',
  ) {
    this.logger = new Logger(gatewayName);
    this.mode = mode;
  }

  protected get socket(): SocketHelper {
    if (!this.server) throw new Error('Server not initialized yet');
    return new SocketHelper(this.server, this.usersMap);
  }

  async handleConnection(client: Socket): Promise<void> {
    const payload = await this.guard.verifyApiKey(client, this.mode);

    if (!payload && this.mode === 'private') {
      client.data.user = null;
      this.logger.log(`Anonymous client tried to connect: ${client.id}`);
      client.disconnect(true);
      return;
    }

    const userId = payload?.sub ? String(payload.sub) : null;
    client.data.user = payload ?? null;

    if (userId) {
      if (!this.usersMap.has(userId)) this.usersMap.set(userId, new Set());
      this.usersMap.get(userId)!.add(client);
      this.logger.log(
        `account ${userId} connected with socket ${client.id} (total ${
          this.usersMap.get(userId)!.size
        })`,
      );
    } else {
      this.logger.log(
        `Anonymous client connected on public namespace: ${client.id}`,
      );
    }

    const room = client.handshake.query.room as string | undefined;
    if (room) {
      void client.join(room);
      this.logger.log(`Client ${client.id} joined room ${room}`);
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = client.data?.user?.sub ? String(client.data.user.sub) : null;

    const room = client.handshake.query.room as string | undefined;
    if (room) {
      void client.leave(room);
      this.server.to(room).emit('user-left', {
        message: `User left: ${client.id}`,
      });
      this.logger.log(`Client ${client.id} left room ${room}`);
    }

    if (!userId || !this.usersMap.has(userId)) return;

    const sockets = this.usersMap.get(userId)!;
    sockets.delete(client);
    if (sockets.size === 0) this.usersMap.delete(userId);

    this.logger.log(
      `account ${userId} disconnected socket ${client.id} (remaining ${sockets.size})`,
    );
  }
}
