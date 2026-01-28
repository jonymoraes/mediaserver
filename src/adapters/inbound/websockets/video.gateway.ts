import { WebSocketGateway } from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { WebsocketGuard } from '@/src/platform/shared/guards/websocket.guard';
import { BaseGateway } from '@/src/platform/shared/websockets/base.gateway';

//  BullMQ
import { QueueEvents } from 'bullmq';
import { createBullMQRedisConfig } from '@/src/platform/config/settings/bullmq.config';

@WebSocketGateway({
  namespace: 'video',
  cors: { origin: '*', credentials: false },
})
@Injectable()
export class VideoGateway extends BaseGateway {
  private readonly imageEvents = new QueueEvents('video-processing', {
    connection: createBullMQRedisConfig(),
  });

  private eventsRegistered = false;

  constructor(protected readonly guard: WebsocketGuard) {
    super(guard, VideoGateway.name, 'private');
    this.registerQueueListeners();
  }

  private registerQueueListeners(): void {
    if (this.eventsRegistered) return;
    this.eventsRegistered = true;

    //  Progress
    this.imageEvents.on('progress', ({ jobId, data }) => {
      this.server.emit('video-progress', {
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

      this.server.emit('video-completed', {
        jobId: jobId,
        url: payload.url,
      });
    });

    //  Removed / Failed
    this.imageEvents.on('failed', ({ jobId }) => {
      this.server.emit('video-canceled', { jobId });
    });

    this.logger.log('Video queue listeners registered.');
  }
}
