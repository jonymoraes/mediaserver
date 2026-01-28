export abstract class UpdateTransferPort {
  abstract execute(userId: string, size: number): Promise<void>;
}
