import { Module, Global } from '@nestjs/common';
import { REDIS_CLIENT } from 'src/adapters/outbound/cache/redis-tokens';
import { RedisPort } from 'src/domain/ports/outbound/redis.port';
import { RedisCache } from 'src/adapters/outbound/cache/redis-cache';
import { createRedisClient } from 'src/platform/config/settings/redis.config';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => createRedisClient(),
    },
    {
      provide: RedisPort,
      useClass: RedisCache,
    },
  ],
  exports: [RedisPort, REDIS_CLIENT],
})
export class RedisModule {}
