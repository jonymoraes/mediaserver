import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

//  Entities
import { Quota } from 'src/domain/entities/quota.entity';

//  Ports
import { QuotaPort } from 'src/domain/ports/outbound/quota.port';
import { RedisPort } from 'src/domain/ports/outbound/redis.port';

//  Constants
import { RedisKeys } from 'src/adapters/outbound/cache/redis-keys';
import { RedisTTL } from 'src/adapters/outbound/cache/redis-ttl';

//  Helpers
import { DateHelper } from 'src/platform/shared/helpers/date.helper';

@Injectable()
export class QuotaRepository extends QuotaPort {
  constructor(
    @InjectRepository(Quota)
    private readonly repo: Repository<Quota>,
    private readonly redis: RedisPort,
  ) {
    super();
  }

  /**
   * @description Find quota by id with cache
   * @param id
   */
  async findById(id: string): Promise<Quota | null> {
    const key = RedisKeys.quotaById(id);

    const cached = await this.redis.get<Quota>(key);
    if (cached) return cached;

    const entity = await this.repo.findOne({
      where: { id },
      relations: ['account'],
    });

    if (entity) {
      await this.redis.set(key, entity, RedisTTL.QUOTA);
      await this.redis.set(
        RedisKeys.quotaByAccountId(entity.accountId),
        entity,
        RedisTTL.QUOTA,
      );
    }

    return entity;
  }

  /**
   * @description Find current month quota by accountId
   * If not exists, it will be created
   * @param accountId
   */
  async findByAccountId(accountId: string): Promise<Quota> {
    const key = RedisKeys.quotaByAccountId(accountId);

    const cached = await this.redis.get<Quota>(key);
    if (cached) return cached;

    const period = DateHelper.currentMonth();

    let entity = await this.repo.findOne({
      where: { accountId, period },
      relations: ['account'],
    });

    if (!entity) {
      entity = await this.create(accountId);
    }

    await this.redis.set(key, entity, RedisTTL.QUOTA);
    await this.redis.set(
      RedisKeys.quotaById(entity.id),
      entity,
      RedisTTL.QUOTA,
    );

    return entity;
  }

  /**
   * @description Create current month quota for account
   * @param accountId
   */
  async create(accountId: string): Promise<Quota> {
    const period = DateHelper.currentMonth();

    const entity = await this.repo.save(
      this.repo.create({
        accountId,
        period,
      }),
    );

    await this.redis.set(
      RedisKeys.quotaById(entity.id),
      entity,
      RedisTTL.QUOTA,
    );
    await this.redis.set(
      RedisKeys.quotaByAccountId(accountId),
      entity,
      RedisTTL.QUOTA,
    );

    return entity;
  }

  /**
   * @description Save quota and refresh cache
   * @param quota
   */
  async save(quota: Quota): Promise<Quota> {
    const before = quota.id ? await this.findById(quota.id) : null;

    const saved = await this.repo.save(quota);

    const keys: string[] = [
      RedisKeys.quotaById(saved.id),
      RedisKeys.quotaByAccountId(saved.accountId),
    ];

    if (before && before.accountId !== saved.accountId) {
      keys.push(RedisKeys.quotaByAccountId(before.accountId));
    }

    await this.redis.delete(keys);

    await this.redis.set(RedisKeys.quotaById(saved.id), saved, RedisTTL.QUOTA);
    await this.redis.set(
      RedisKeys.quotaByAccountId(saved.accountId),
      saved,
      RedisTTL.QUOTA,
    );

    return saved;
  }

  /**
   * @description Delete quota by id
   * @param id
   */
  async delete(id: string): Promise<boolean> {
    const before = await this.findById(id);
    if (!before) return false;

    await this.repo.delete(id);

    await this.redis.delete([
      RedisKeys.quotaById(id),
      RedisKeys.quotaByAccountId(before.accountId),
    ]);

    return true;
  }
}
