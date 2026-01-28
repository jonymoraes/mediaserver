import { Queue } from 'bullmq';
import { createBullMQRedisConfig } from '@/src/platform/config/settings/bullmq.config';

export const imageProcessQueue = new Queue('image-processing', {
  connection: createBullMQRedisConfig(),
});
