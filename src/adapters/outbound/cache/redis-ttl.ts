/**
 * @description Centralized Redis TTLs (in seconds)
 */
export class RedisTTL {
  static readonly ACCOUNT = 300;
  static readonly QUOTA = 300;
  static readonly IMAGE = 300;
  static readonly VIDEO = 300;

  // Jobs (BullMQ)
  static readonly IMAGE_JOB = 3600;
  static readonly VIDEO_JOB = 7200;
}
