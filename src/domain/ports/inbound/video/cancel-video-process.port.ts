export abstract class CancelVideoProcessPort {
  abstract execute(jobId: string): Promise<{ message: string }>;
}
