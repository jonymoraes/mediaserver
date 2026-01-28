import { MultipartFile } from '@fastify/multipart';

export abstract class UploadImagePort {
  abstract execute(
    userId: string,
    file: MultipartFile,
    context?: string,
  ): Promise<{ message: string; jobId: string }>;
}
