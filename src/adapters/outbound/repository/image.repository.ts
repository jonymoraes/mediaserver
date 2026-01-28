import { Injectable } from '@nestjs/common';
import { Repository, LessThan } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

// Entities
import { Image } from 'src/domain/entities/image.entity';

// Ports
import { ImagePort } from 'src/domain/ports/outbound/image.port';
import { RedisPort } from 'src/domain/ports/outbound/redis.port';

// Constants
import { RedisKeys } from 'src/adapters/outbound/cache/redis-keys';
import { RedisTTL } from 'src/adapters/outbound/cache/redis-ttl';
import { ImageJobData } from '@/src/platform/shared/constants/media/file';
import { JobStatus } from '@/src/platform/shared/constants/messaging';
import { MediaStatus } from '@/src/platform/shared/constants/status/media';

@Injectable()
export class ImageRepository extends ImagePort {
  constructor(
    @InjectRepository(Image)
    private readonly repo: Repository<Image>,
    private readonly redis: RedisPort,
  ) {
    super();
  }

  // ------------------ Image Jobs ------------------
  /**
   * @description Find image job by id with cache
   * @param jobId
   */
  async getImageJob(jobId: string): Promise<ImageJobData | null> {
    return this.redis.get<ImageJobData>(RedisKeys.imageJobById(jobId));
  }
  /**
   * @description Save image job
   * @param jobId
   */
  async saveImageJob(job: ImageJobData): Promise<void> {
    await this.redis.set(
      RedisKeys.imageJobById(job.jobId),
      job,
      RedisTTL.IMAGE_JOB,
    );
  }

  /**
   * @description Mark image job as processing
   * @param jobId
   */
  async markImageJobProcessing(jobId: string): Promise<void> {
    const job = await this.getImageJob(jobId);
    if (!job) return;

    job.status = JobStatus.PROCESSING;
    await this.saveImageJob(job);
  }

  /**
   * @description Mark image job as cancelled
   * @param jobId
   */
  async markImageJobCanceled(jobId: string): Promise<void> {
    const job = await this.getImageJob(jobId);
    if (!job) return;

    job.status = JobStatus.CANCELED;
    await this.saveImageJob(job);
  }

  /**
   * @description Mark image job as completed
   * @param jobId
   */
  async markImageJobCompleted(jobId: string): Promise<void> {
    const job = await this.getImageJob(jobId);
    if (!job) return;

    job.status = JobStatus.DONE;
    await this.saveImageJob(job);
  }

  /**
   * @description Delete image job by id
   * @param jobId
   */
  async deleteImageJob(jobId: string): Promise<void> {
    await this.redis.delete(RedisKeys.imageJobById(jobId));
  }

  // ------------------ Image (DB) ------------------
  /**
   * @description Find image by id with cache
   * @param id
   */
  async findById(id: string): Promise<Image | null> {
    const key = RedisKeys.imageById(id);

    const cached = await this.redis.get<Image>(key);
    if (cached) return cached;

    const entity = await this.repo.findOne({
      where: { id },
    });

    if (entity) {
      await this.redis.set(key, entity, RedisTTL.IMAGE);
    }

    return entity;
  }

  /**
   * @description Find images by accountId
   * @param accountId
   */
  async findByAccountId(accountId: string): Promise<Image[]> {
    const key = RedisKeys.imagesByAccountId(accountId);

    const cached = await this.redis.get<Image[]>(key);
    if (cached) return cached;

    const entities = await this.repo.find({
      where: { accountId },
      order: { createdAt: 'DESC' },
    });

    await this.redis.set(key, entities, RedisTTL.IMAGE);

    return entities;
  }

  /**
   * @description Find image by filename and accountId
   * @param filename
   * @param accountId
   */
  async findByFilename(
    filename: string,
    accountId: string,
  ): Promise<Image | null> {
    const entity = await this.repo.findOne({
      where: { filename, accountId },
    });

    if (entity) {
      await this.redis.set(
        RedisKeys.imageById(entity.id),
        entity,
        RedisTTL.IMAGE,
      );
    }

    return entity;
  }

  /**
   *  @description Find expired image entries
   *  @param batchSize
   */
  async findExpired(batchSize = 100): Promise<Image[]> {
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
   * @description Create image
   * @param data
   */
  async create(data: Partial<Image>): Promise<Image> {
    const entity = await this.repo.save(this.repo.create(data));

    await this.redis.set(
      RedisKeys.imageById(entity.id),
      entity,
      RedisTTL.IMAGE,
    );

    await this.redis.delete([RedisKeys.imagesByAccountId(entity.accountId)]);

    return entity;
  }

  /**
   * @description Save image (insert or update)
   * @param image
   */
  async save(image: Image): Promise<Image> {
    const before = image.id ? await this.findById(image.id) : null;

    const saved = await this.repo.save(image);

    const keys: string[] = [
      RedisKeys.imageById(saved.id),
      RedisKeys.imagesByAccountId(saved.accountId),
    ];

    if (before && before.accountId !== saved.accountId) {
      keys.push(RedisKeys.imagesByAccountId(before.accountId));
    }

    await this.redis.delete(keys);

    await this.redis.set(RedisKeys.imageById(saved.id), saved, RedisTTL.IMAGE);

    return saved;
  }

  /**
   * @description Delete image by id
   * @param id
   */
  async delete(id: string): Promise<boolean> {
    const before = await this.findById(id);
    if (!before) return false;

    await this.repo.delete(id);

    await this.redis.delete([
      RedisKeys.imageById(id),
      RedisKeys.imagesByAccountId(before.accountId),
    ]);

    return true;
  }
}
