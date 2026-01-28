import Redis from 'ioredis';

/**
 * @description Abstract class defining the Redis contract.
 */
export abstract class RedisPort {
  protected abstract redis: Redis;

  // ------------------ Keys ------------------
  /**
   * @description Delete one or more keys
   * @param key
   */
  abstract delete(key: string | string[]): Promise<number>;

  /**
   * @description Delete all keys with the given prefix
   * @param prefix
   */
  abstract deleteByPrefix(prefix: string): Promise<void>;

  /**
   * @description Get all keys matching the given pattern
   * @param pattern
   */
  abstract keys(pattern: string): Promise<string[]>;

  // ------------------ Strings ------------------
  abstract get<T = any>(key: string): Promise<T | null>;
  abstract set<T = any>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<'OK'>;
  abstract incr(key: string, amount?: number): Promise<number>;
  abstract decr(key: string, amount?: number): Promise<number>;

  // ------------------ Hashes ------------------
  abstract hget(key: string, field: string): Promise<string | null>;
  abstract hset(key: string, field: string, value: string): Promise<number>;
  abstract hgetall(key: string): Promise<Record<string, string>>;
  abstract hincrby(
    key: string,
    field: string,
    increment: number,
  ): Promise<number>;
  abstract hdel(key: string, field: string | string[]): Promise<number>;

  // ------------------ Sets ------------------
  abstract sadd(key: string, member: string | string[]): Promise<number>;
  abstract srem(key: string, member: string | string[]): Promise<number>;
  abstract smembers(key: string): Promise<string[]>;
  abstract scard(key: string): Promise<number>;
  abstract sismember(key: string, member: string): Promise<boolean>;

  // ------------------ Lists ------------------
  abstract lpush(key: string, value: string | string[]): Promise<number>;
  abstract rpush(key: string, value: string | string[]): Promise<number>;
  abstract lpop(key: string): Promise<string | null>;
  abstract rpop(key: string): Promise<string | null>;
  abstract lrange(
    key: string,
    start?: number,
    stop?: number,
  ): Promise<string[]>;
  abstract llen(key: string): Promise<number>;

  // ------------------ Sorted Sets ------------------
  abstract zadd(key: string, score: number, member: string): Promise<number>;
  abstract zrange(
    key: string,
    start?: number,
    stop?: number,
  ): Promise<string[]>;
  abstract zrangeWithScores(
    key: string,
    start?: number,
    stop?: number,
  ): Promise<[string, number][]>;
  abstract zrem(key: string, member: string | string[]): Promise<number>;
  abstract zcard(key: string): Promise<number>;
  abstract zscore(key: string, member: string): Promise<number | null>;

  // ------------------ Expiration ------------------
  abstract expire(key: string, seconds: number): Promise<number>;
  abstract ttl(key: string): Promise<number>;
  abstract persist(key: string): Promise<number>;
}
