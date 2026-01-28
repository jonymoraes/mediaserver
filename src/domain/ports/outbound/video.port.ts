import { Video } from 'src/domain/entities/video.entity';
import { VideoJobData } from '@/src/platform/shared/constants/media/file';

/**
 * @description Abstract port for Video persistence and video jobs
 */
export abstract class VideoPort {
  // ------------------ Video Jobs ------------------
  /**
   * @description Find video job by id
   * @param jobId
   */
  abstract getVideoJob(jobId: string): Promise<VideoJobData | null>;

  /**
   * @description Save video job
   * @param job
   */
  abstract saveVideoJob(job: VideoJobData): Promise<void>;

  /**
   * @description Mark video job as processing
   * @param jobId
   */
  abstract markVideoJobProcessing(jobId: string): Promise<void>;

  /**
   * @description Mark video job as canceled
   * @param jobId
   */
  abstract markVideoJobCanceled(jobId: string): Promise<void>;

  /**
   * @description Mark video job as completed
   * @param jobId
   */
  abstract markVideoJobCompleted(jobId: string): Promise<void>;

  /**
   * @description Delete video job by id
   * @param jobId
   */
  abstract deleteVideoJob(jobId: string): Promise<void>;

  // ------------------ Video (DB) ------------------
  /**
   * @description Find video by id
   * @param id
   */
  abstract findById(id: string): Promise<Video | null>;

  /**
   * @description Find videos by accountId
   * @param accountId
   */
  abstract findByAccountId(accountId: string): Promise<Video[]>;

  /**
   * @description Find video by filename and accountId
   * @param filename
   * @param accountId
   */
  abstract findByFilename(
    filename: string,
    accountId: string,
  ): Promise<Video | null>;

  /**
   * @description Find expired temporary videos in batches
   * @param batchSize Number of videos to return in one batch
   */
  abstract findExpired(batchSize?: number): Promise<Video[]>;

  /**
   * @description Create video
   * @param Partial<Video>
   */
  abstract create(data: Partial<Video>): Promise<Video>;

  /**
   * @description Save video (insert or update)
   * @param video
   */
  abstract save(video: Video): Promise<Video>;

  /**
   * @description Delete video by id
   * @partam id
   */
  abstract delete(id: string): Promise<boolean>;
}
