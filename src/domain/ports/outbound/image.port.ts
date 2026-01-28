import { Image } from 'src/domain/entities/image.entity';
import { ImageJobData } from '@/src/platform/shared/constants/media/file';

export abstract class ImagePort {
  // ------------------ Image Jobs ------------------
  /**
   * @description Find image job by id
   * @param jobId
   */
  abstract getImageJob(jobId: string): Promise<ImageJobData | null>;

  /**
   * @description Save image job
   * @param jobId
   */
  abstract saveImageJob(job: ImageJobData): Promise<void>;

  /**
   * @description Mark image job as processing
   * @param jobId
   */
  abstract markImageJobProcessing(jobId: string): Promise<void>;

  /**
   * @description Mark image job as cancelled
   * @param jobId
   */
  abstract markImageJobCanceled(jobId: string): Promise<void>;

  /**
   * @description Mark image job as completed
   * @paramn jobId
   */
  abstract markImageJobCompleted(jobId: string): Promise<void>;

  /**
   * @description Delete image job by id
   * @param jobId
   */
  abstract deleteImageJob(jobId: string): Promise<void>;

  // ------------------ Image (DB) ------------------
  /**
   * @description Find image by id
   * @param id
   */
  abstract findById(id: string): Promise<Image | null>;

  /**
   * @description Find images by accountId
   * @param accountId
   */
  abstract findByAccountId(accountId: string): Promise<Image[]>;

  /**
   * @description Find image by filename and accountId
   * @param filename
   * @param accountId
   */
  abstract findByFilename(
    filename: string,
    accountId: string,
  ): Promise<Image | null>;

  /**
   * @description Find expired temporary images in batches
   * @param batchSize Number of images to return in one batch
   */
  abstract findExpired(batchSize?: number): Promise<Image[]>;

  /**
   * @description Create image
   * @param data
   */
  abstract create(data: Partial<Image>): Promise<Image>;

  /**
   * @description Save image (insert or update)
   * @param image
   */
  abstract save(image: Image): Promise<Image>;

  /**
   * @description Delete image by id
   * @param id
   */
  abstract delete(id: string): Promise<boolean>;
}
