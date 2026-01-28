import { WebSocketGateway } from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { WebsocketGuard } from '@/src/platform/shared/guards/websocket.guard';
import { BaseGateway } from '@/src/platform/shared/websockets/base.gateway';

//  BullMQ
import { QueueEvents } from 'bullmq';
import { createBullMQRedisConfig } from '@/src/platform/config/settings/bullmq.config';

@WebSocketGateway({
  namespace: 'image',
  cors: { origin: '*', credentials: false },
})
@Injectable()
export class ImageGateway extends BaseGateway {
  private readonly imageEvents = new QueueEvents('image-processing', {
    connection: createBullMQRedisConfig(),
  });

  private eventsRegistered = false;

  constructor(protected readonly guard: WebsocketGuard) {
    super(guard, ImageGateway.name, 'private');
    this.registerQueueListeners();
  }

  private registerQueueListeners(): void {
    if (this.eventsRegistered) return;
    this.eventsRegistered = true;

    //  Progress
    this.imageEvents.on('progress', ({ jobId, data }) => {
      this.server.emit('image-progress', {
        jobId,
        ...(typeof data === 'object' ? data : { percentage: data }),
      });
    });

    //  Completed
    this.imageEvents.on('completed', ({ jobId, returnvalue }) => {
      const payload =
        typeof returnvalue === 'object' && returnvalue !== null
          ? returnvalue
          : { url: returnvalue };

      this.server.emit('image-completed', {
        jobId: jobId,
        url: payload.url,
      });
    });

    //  Removed / Failed
    this.imageEvents.on('failed', ({ jobId }) => {
      this.server.emit('image-canceled', { jobId });
    });

    this.logger.log('Image queue listeners registered.');
  }
}
