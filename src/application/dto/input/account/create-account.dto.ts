import { IsNotEmpty, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * @description DTO for creating an Account
 */
export class CreateAccountDto {
  @IsNotEmpty({ message: i18nValidationMessage('account.dto.name.required') })
  @MaxLength(100, {
    message: i18nValidationMessage('account.dto.name.maxLength'),
  })
  name: string;

  @IsNotEmpty({ message: i18nValidationMessage('account.dto.domain.required') })
  @MaxLength(100, {
    message: i18nValidationMessage('account.dto.domain.maxLength'),
  })
  domain: string;
}
