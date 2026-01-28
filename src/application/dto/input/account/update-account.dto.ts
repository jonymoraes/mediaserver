import { IsOptional, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * @description DTO for updating an Account
 */
export class UpdateAccountDto {
  @IsOptional()
  @MaxLength(100, {
    message: i18nValidationMessage('account.dto.name.maxLength'),
  })
  name?: string;

  @IsOptional()
  @MaxLength(100, {
    message: i18nValidationMessage('account.dto.domain.maxLength'),
  })
  domain?: string;
}
