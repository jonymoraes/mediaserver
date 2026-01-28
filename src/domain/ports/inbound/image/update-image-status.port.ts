export abstract class UpdateImageStatusPort {
  abstract execute(
    userId: string,
    filename: string,
  ): Promise<{ message: string }>;
}
