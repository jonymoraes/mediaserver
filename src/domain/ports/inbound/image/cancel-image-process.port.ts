export abstract class CancelImageProcessPort {
  abstract execute(jobId: string): Promise<{ message: string }>;
}
