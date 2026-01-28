import { CreateAccountDto } from 'src/application/dto/input/account/create-account.dto';

/**
 * @description Inbound port for creating accounts
 * Defines the interface that the UseCase must implement
 */
export abstract class CreateAccountPort {
  /**
   * @description Executes account creation and returns a message
   * @param dto CreateAccountDto
   */
  abstract execute(
    dto: CreateAccountDto,
  ): Promise<{ message: string; apikey: string }>;
}
