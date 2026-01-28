import { Injectable } from '@nestjs/common';
import { Repository, LessThan } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

// Entities
import { Video } from 'src/domain/entities/video.entity';

// Ports
import { VideoPort } from 'src/domain/ports/outbound/video.port';
import { RedisPort } from 'src/domain/ports/outbound/redis.port';

// Constants
import { RedisKeys } from 'src/adapters/outbound/cache/redis-keys';
import { RedisTTL } from 'src/adapters/outbound/cache/redis-ttl';
import { VideoJobData } from '@/src/platform/shared/constants/media/file';
import { JobStatus } from '@/src/platform/shared/constants/messaging';
import { MediaStatus } from '@/src/platform/shared/constants/status/media';

@Injectable()
export class VideoRepository extends VideoPort {
  constructor(
    @InjectRepository(Video)
    private readonly repo: Repository<Video>,
    private readonly redis: RedisPort,
  ) {
    super();
  }

  // ------------------ Video Jobs ------------------
  /**
   * @description Find video job by id with cache
   * @param jobId
   */
  async getVideoJob(jobId: string): Promise<VideoJobData | null> {
    return this.redis.get<VideoJobData>(RedisKeys.videoJobById(jobId));
  }

  /**
   * @description Save video job
   * @param job
   */
  async saveVideoJob(job: VideoJobData): Promise<void> {
    await this.redis.set(
      RedisKeys.videoJobById(job.jobId),
      job,
      RedisTTL.VIDEO_JOB,
    );
  }

  /**
   * @description Mark video job as processing
   * @param jobId
   */
  async markVideoJobProcessing(jobId: string): Promise<void> {
    const job = await this.getVideoJob(jobId);
    if (!job) return;

    job.status = JobStatus.PROCESSING;
    await this.saveVideoJob(job);
  }

  /**
   * @description Mark video job as canceled
   * @param jobId
   */
  async markVideoJobCanceled(jobId: string): Promise<void> {
    const job = await this.getVideoJob(jobId);
    if (!job) return;

    job.status = JobStatus.CANCELED;
    await this.saveVideoJob(job);
  }

  /**
   * @description Mark video job as completed
   * @param jobId
   */
  async markVideoJobCompleted(jobId: string): Promise<void> {
    const job = await this.getVideoJob(jobId);
    if (!job) return;

    job.status = JobStatus.DONE;
    await this.saveVideoJob(job);
  }

  /**
   * @description Delete video job by id
   * @param jobId
   */
  async deleteVideoJob(jobId: string): Promise<void> {
    await this.redis.delete(RedisKeys.videoJobById(jobId));
  }

  // ------------------ Video (DB) ------------------
  /**
   * @description Find video by id with cache
   * @param id
   */
  async findById(id: string): Promise<Video | null> {
    const key = RedisKeys.videoById(id);

    const cached = await this.redis.get<Video>(key);
    if (cached) return cached;

    const entity = await this.repo.findOne({ where: { id } });

    if (entity) {
      await this.redis.set(key, entity, RedisTTL.VIDEO);
    }

    return entity;
  }

  /**
   * @description Find videos by accountId
   * @param accountId
   */
  async findByAccountId(accountId: string): Promise<Video[]> {
    const key = RedisKeys.videosByAccountId(accountId);

    const cached = await this.redis.get<Video[]>(key);
    if (cached) return cached;

    const entities = await this.repo.find({
      where: { accountId },
      order: { createdAt: 'DESC' },
    });

    await this.redis.set(key, entities, RedisTTL.VIDEO);

    return entities;
  }

  /**
   * @description Find video by filename and accountId
   * @param filename
   * @param accountId
   */
  async findByFilename(
    filename: string,
    accountId: string,
  ): Promise<Video | null> {
    const entity = await this.repo.findOne({
      where: { filename, accountId },
    });

    if (entity) {
      await this.redis.set(
        RedisKeys.videoById(entity.id),
        entity,
        RedisTTL.VIDEO,
      );
    }

    return entity;
  }

  /**
   *  @description Find expired video entries
   *  @param batchSize
   */
  async findExpired(batchSize = 100): Promise<Video[]> {
    const now = new Date();

    return this.repo.find({
      where: {
        status: MediaStatus.TEMPORARY,
        expiresAt: LessThan(now),
      },
      order: { createdAt: 'ASC' },
      take: batchSize,
      relations: ['account', 'quota'],
    });
  }

  /**
   * @description Create video
   * @param data
   */
  async create(data: Partial<Video>): Promise<Video> {
    const entity = await this.repo.save(this.repo.create(data));

    await this.redis.set(
      RedisKeys.videoById(entity.id),
      entity,
      RedisTTL.VIDEO,
    );
    await this.redis.delete([RedisKeys.videosByAccountId(entity.accountId)]);

    return entity;
  }

  /**
   * @description Save video (insert or update)
   * @param video
   */
  async save(video: Video): Promise<Video> {
    const before = video.id ? await this.findById(video.id) : null;

    const saved = await this.repo.save(video);

    const keys: string[] = [
      RedisKeys.videoById(saved.id),
      RedisKeys.videosByAccountId(saved.accountId),
    ];

    if (before && before.accountId !== saved.accountId) {
      keys.push(RedisKeys.videosByAccountId(before.accountId));
    }

    await this.redis.delete(keys);
    await this.redis.set(RedisKeys.videoById(saved.id), saved, RedisTTL.VIDEO);

    return saved;
  }

  /**
   * @description Delete video by id
   * @param id
   */
  async delete(id: string): Promise<boolean> {
    const before = await this.findById(id);
    if (!before) return false;

    await this.repo.delete(id);

    await this.redis.delete([
      RedisKeys.videoById(id),
      RedisKeys.videosByAccountId(before.accountId),
    ]);

    return true;
  }
}
