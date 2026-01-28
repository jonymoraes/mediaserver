import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { RedisPort } from 'src/domain/ports/outbound/redis.port';
import { RedisKeys } from 'src/adapters/outbound/cache/redis-keys';
import { RedisTTL } from '@/src/adapters/outbound/cache/redis-ttl';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly limit: number;

  constructor(
    private readonly redis: RedisPort,
    private readonly config: ConfigService,
  ) {
    this.limit = Number(this.config.get<string>('RATE_LIMIT_PER_MINUTE')) || 10;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    //  Allow GET without limit
    if (req.method === 'GET') return true;

    const identity = this.getIdentity(req);
    const path = req.route?.path ?? req.url;

    const key = RedisKeys.rateLimit(identity, path);

    const current = await this.redis.incr(key, 1);

    if (current === 1) {
      await this.redis.expire(key, RedisTTL.RATE_LIMIT);
    }

    if (current > this.limit) {
      throw new HttpException(
        'Too many requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private getIdentity(req: Request): string {
    const user = (req as any).user;
    return user?.id ?? req.ip;
  }
}
