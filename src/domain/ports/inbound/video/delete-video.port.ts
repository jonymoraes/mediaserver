export abstract class DeleteVideoPort {
  abstract execute(
    userId: string,
    filename: string,
  ): Promise<{ message: string }>;
}
