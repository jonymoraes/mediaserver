export abstract class UpdateVideoStatusPort {
  abstract execute(
    userId: string,
    filename: string,
  ): Promise<{ message: string }>;
}
