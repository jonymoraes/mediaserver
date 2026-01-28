import { Queue } from 'bullmq';
import { createBullMQRedisConfig } from '@/src/platform/config/settings/bullmq.config';

export const videoProcessQueue = new Queue('video-processing', {
  connection: createBullMQRedisConfig(),
});
