import { Inject, Injectable } from '@nestjs/common';
import { RedisPort } from 'src/domain/ports/outbound/redis.port';
import { REDIS_CLIENT } from './redis-tokens';
import Redis from 'ioredis';

@Injectable()
export class RedisCache extends RedisPort {
  protected redis: Redis;

  constructor(@Inject(REDIS_CLIENT) redis: Redis) {
    super();
    this.redis = redis;
  }

  // ------------------ Keys ------------------
  async keys(pattern: string): Promise<string[]> {
    return await this.redis.keys(pattern);
  }

  async delete(key: string | string[]) {
    if (Array.isArray(key)) return this.redis.del(...key);
    return await this.redis.del(key);
  }

  async deleteByPrefix(prefix: string) {
    const stream = this.redis.scanStream({
      match: `${prefix}*`,
      count: 100,
    });

    const pipeline = this.redis.pipeline();

    stream.on('data', (keys: string[]) => {
      if (keys.length) {
        keys.forEach((key) => pipeline.del(key));
      }
    });

    await new Promise<void>((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
    });

    await pipeline.exec();
  }

  // ------------------ Strings ------------------
  async get<T = any>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? (JSON.parse(data) as T) : null;
  }

  async set<T = any>(key: string, value: T, ttlSeconds?: number) {
    if (ttlSeconds)
      return await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    return this.redis.set(key, JSON.stringify(value));
  }

  async incr(key: string, amount = 1): Promise<number> {
    return await this.redis.incrby(key, amount);
  }

  async decr(key: string, amount = 1): Promise<number> {
    return await this.redis.decrby(key, amount);
  }

  // ------------------ Hashes ------------------
  async hget(key: string, field: string) {
    return await this.redis.hget(key, field);
  }

  async hset(key: string, field: string, value: string) {
    return await this.redis.hset(key, field, value);
  }

  async hgetall(key: string) {
    return await this.redis.hgetall(key);
  }

  async hincrby(key: string, field: string, increment: number) {
    return await this.redis.hincrby(key, field, increment);
  }

  async hdel(key: string, field: string | string[]) {
    if (Array.isArray(field)) return this.redis.hdel(key, ...field);
    return await this.redis.hdel(key, field);
  }

  // ------------------ Sets ------------------
  async sadd(key: string, member: string | string[]) {
    if (Array.isArray(member)) return this.redis.sadd(key, ...member);
    return await this.redis.sadd(key, member);
  }

  async srem(key: string, member: string | string[]) {
    if (Array.isArray(member)) return this.redis.srem(key, ...member);
    return await this.redis.srem(key, member);
  }

  async smembers(key: string) {
    return await this.redis.smembers(key);
  }

  async scard(key: string) {
    return await this.redis.scard(key);
  }

  async sismember(key: string, member: string) {
    const result = await this.redis.sismember(key, member);
    return result === 1;
  }

  // ------------------ Lists ------------------
  async lpush(key: string, value: string | string[]) {
    if (Array.isArray(value)) return this.redis.lpush(key, ...value);
    return await this.redis.lpush(key, value);
  }

  async rpush(key: string, value: string | string[]) {
    if (Array.isArray(value)) return this.redis.rpush(key, ...value);
    return await this.redis.rpush(key, value);
  }

  async lpop(key: string) {
    return await this.redis.lpop(key);
  }

  async rpop(key: string) {
    return await this.redis.rpop(key);
  }

  async lrange(key: string, start = 0, stop = -1) {
    return await this.redis.lrange(key, start, stop);
  }

  async llen(key: string) {
    return await this.redis.llen(key);
  }

  // ------------------ Sorted Sets ------------------
  async zadd(key: string, score: number, member: string) {
    return await this.redis.zadd(key, score, member);
  }

  async zrange(key: string, start = 0, stop = -1) {
    return await this.redis.zrange(key, start, stop);
  }

  async zrangeWithScores(key: string, start = 0, stop = -1) {
    const results = await this.redis.zrange(key, start, stop, 'WITHSCORES');
    const output: [string, number][] = [];
    for (let i = 0; i < results.length; i += 2) {
      output.push([results[i], Number(results[i + 1])]);
    }
    return output;
  }

  async zrem(key: string, member: string | string[]) {
    if (Array.isArray(member)) return this.redis.zrem(key, ...member);
    return await this.redis.zrem(key, member);
  }

  async zcard(key: string) {
    return await this.redis.zcard(key);
  }

  async zscore(key: string, member: string) {
    const score = await this.redis.zscore(key, member);
    return score ? Number(score) : null;
  }

  // ------------------ Expiration ------------------
  async expire(key: string, seconds: number) {
    return await this.redis.expire(key, seconds);
  }

  async ttl(key: string) {
    return await this.redis.ttl(key);
  }

  async persist(key: string) {
    return await this.redis.persist(key);
  }
}
