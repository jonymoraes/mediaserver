import { MultipartFile } from '@fastify/multipart';

export abstract class UploadVideoPort {
  abstract execute(
    userId: string,
    file: MultipartFile,
    format?: string,
  ): Promise<{ message: string; jobId: string }>;
}
