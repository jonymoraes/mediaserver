import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

//  Entities
import { Account } from 'src/domain/entities/account.entity';

//  Ports
import { AccountPort } from 'src/domain/ports/outbound/account.port';
import { RedisPort } from 'src/domain/ports/outbound/redis.port';

//  Constants
import { RedisKeys } from 'src/adapters/outbound/cache/redis-keys';
import { RedisTTL } from 'src/adapters/outbound/cache/redis-ttl';

@Injectable()
export class AccountRepository extends AccountPort {
  constructor(
    @InjectRepository(Account)
    private readonly repo: Repository<Account>,
    private readonly redis: RedisPort,
  ) {
    super();
  }

  /**
   * @description Count total accounts (no cache)
   */
  async count(): Promise<number> {
    return this.repo.count();
  }

  /**
   * @description Find accounts with quotas, paginated and ordered, excluding Admins
   * @param skip?
   * @param take?
   * @param orderBy?
   * @param orderDirection?
   */
  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: keyof Account;
    orderDirection?: 'ASC' | 'DESC';
  }): Promise<Account[]> {
    const {
      skip,
      take,
      orderBy = 'createdAt',
      orderDirection = 'DESC',
    } = options ?? {};

    const qb = this.repo
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.quotas', 'quota')
      .where('account.role != :adminRole', { adminRole: 'Admin' })
      .orderBy(`account.${orderBy}`, orderDirection);

    if (typeof skip === 'number') qb.skip(skip);
    if (typeof take === 'number') qb.take(take);

    return qb.getMany();
  }

  /**
   * @description Find by id with cache
   * @param id
   */
  async findById(id: string): Promise<Account | null> {
    const key = RedisKeys.accountById(id);

    const cached = await this.redis.get<Account>(key);
    if (cached) return cached;

    const entity = await this.repo.findOne({
      where: { id },
    });

    if (entity) {
      await this.redis.set(key, entity, RedisTTL.ACCOUNT);
      await this.redis.set(
        RedisKeys.accountByApiKey(entity.apikey),
        entity,
        RedisTTL.ACCOUNT,
      );

      if (entity.domain) {
        await this.redis.set(
          RedisKeys.accountByDomain(entity.domain),
          entity,
          RedisTTL.ACCOUNT,
        );
      }
    }

    return entity;
  }

  /**
   * @description Find by domain with cache
   * @param domain
   */
  async findByDomain(domain: string): Promise<Account | null> {
    const key = RedisKeys.accountByDomain(domain);

    const cached = await this.redis.get<Account>(key);
    if (cached) return cached;

    const entity = await this.repo.findOne({
      where: { domain },
    });

    if (entity) {
      await this.redis.set(key, entity, RedisTTL.ACCOUNT);
      await this.redis.set(
        RedisKeys.accountById(entity.id),
        entity,
        RedisTTL.ACCOUNT,
      );
      await this.redis.set(
        RedisKeys.accountByApiKey(entity.apikey),
        entity,
        RedisTTL.ACCOUNT,
      );
    }

    return entity;
  }

  /**
   * @description Find by folder with cache
   * @param folder
   */
  async findByFolder(folder: string): Promise<Account | null> {
    const key = RedisKeys.accountByFolder(folder);

    const cached = await this.redis.get<Account>(key);
    if (cached) return cached;

    const entity = await this.repo.findOne({ where: { folder } });

    if (entity) {
      await this.redis.set(key, entity, RedisTTL.ACCOUNT);
      await this.redis.set(
        RedisKeys.accountById(entity.id),
        entity,
        RedisTTL.ACCOUNT,
      );
      await this.redis.set(
        RedisKeys.accountByApiKey(entity.apikey),
        entity,
        RedisTTL.ACCOUNT,
      );

      if (entity.domain) {
        await this.redis.set(
          RedisKeys.accountByDomain(entity.domain),
          entity,
          RedisTTL.ACCOUNT,
        );
      }
    }

    return entity;
  }

  /**
   * @description Find by apikey with cache
   * @param apikey
   */
  async findByApiKey(apikey: string): Promise<Account | null> {
    const key = RedisKeys.accountByApiKey(apikey);

    const cached = await this.redis.get<Account>(key);
    if (cached) return cached;

    const entity = await this.repo.findOne({
      where: { apikey },
    });

    if (entity) {
      await this.redis.set(key, entity, RedisTTL.ACCOUNT);
      await this.redis.set(
        RedisKeys.accountById(entity.id),
        entity,
        RedisTTL.ACCOUNT,
      );

      if (entity.domain) {
        await this.redis.set(
          RedisKeys.accountByDomain(entity.domain),
          entity,
          RedisTTL.ACCOUNT,
        );
      }
    }

    return entity;
  }

  /**
   * @description Create a new Account record
   * @param data
   */
  async create(data: Partial<Account>): Promise<Account> {
    const entity = await this.repo.save(this.repo.create(data));

    await this.redis.set(
      RedisKeys.accountById(entity.id),
      entity,
      RedisTTL.ACCOUNT,
    );
    await this.redis.set(
      RedisKeys.accountByApiKey(entity.apikey),
      entity,
      RedisTTL.ACCOUNT,
    );

    if (entity.domain) {
      await this.redis.set(
        RedisKeys.accountByDomain(entity.domain),
        entity,
        RedisTTL.ACCOUNT,
      );
    }

    return entity;
  }

  /**
   * @description Update partially by id
   * @param id
   * @param data
   */
  async update(id: string, data: Partial<Account>): Promise<Account | null> {
    const before = await this.findById(id);
    if (!before) return null;

    const result = await this.repo.update(id, data);
    if (result.affected === 0) return null;

    const updated = await this.findById(id);
    if (!updated) return null;

    const keys: string[] = [
      RedisKeys.accountById(id),
      RedisKeys.accountByApiKey(before.apikey),
    ];

    if (before.domain) {
      keys.push(RedisKeys.accountByDomain(before.domain));
    }

    if (updated.domain && before.domain !== updated.domain) {
      keys.push(RedisKeys.accountByDomain(updated.domain));
    }

    await this.redis.delete(keys);

    await this.redis.set(
      RedisKeys.accountById(updated.id),
      updated,
      RedisTTL.ACCOUNT,
    );
    await this.redis.set(
      RedisKeys.accountByApiKey(updated.apikey),
      updated,
      RedisTTL.ACCOUNT,
    );

    if (updated.domain) {
      await this.redis.set(
        RedisKeys.accountByDomain(updated.domain),
        updated,
        RedisTTL.ACCOUNT,
      );
    }

    return updated;
  }

  /**
   * @description Save (insert or update)
   * @param account
   */
  async save(account: Account): Promise<Account> {
    const before = account.id ? await this.findById(account.id) : null;

    const saved = await this.repo.save(account);

    const keys: string[] = [
      RedisKeys.accountById(saved.id),
      RedisKeys.accountByApiKey(saved.apikey),
    ];

    if (before?.apikey && before.apikey !== saved.apikey) {
      keys.push(RedisKeys.accountByApiKey(before.apikey));
    }

    if (before?.domain) {
      keys.push(RedisKeys.accountByDomain(before.domain));
    }

    if (!before || before.domain !== saved.domain) {
      if (saved.domain) {
        keys.push(RedisKeys.accountByDomain(saved.domain));
      }
    }

    await this.redis.delete(keys);

    await this.redis.set(
      RedisKeys.accountById(saved.id),
      saved,
      RedisTTL.ACCOUNT,
    );
    await this.redis.set(
      RedisKeys.accountByApiKey(saved.apikey),
      saved,
      RedisTTL.ACCOUNT,
    );

    if (saved.domain) {
      await this.redis.set(
        RedisKeys.accountByDomain(saved.domain),
        saved,
        RedisTTL.ACCOUNT,
      );
    }

    return saved;
  }

  /**
   * @description Delete by id
   * @param id
   */
  async delete(id: string): Promise<boolean> {
    const before = await this.findById(id);
    if (!before) return false;

    await this.repo.delete(id);

    const keys: string[] = [
      RedisKeys.accountById(id),
      RedisKeys.accountByApiKey(before.apikey),
    ];

    if (before.domain) {
      keys.push(RedisKeys.accountByDomain(before.domain));
    }

    await this.redis.delete(keys);

    return true;
  }
}
