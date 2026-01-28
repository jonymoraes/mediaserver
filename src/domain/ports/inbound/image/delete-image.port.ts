export abstract class DeleteImagePort {
  abstract execute(
    userId: string,
    filename: string,
  ): Promise<{ message: string }>;
}
