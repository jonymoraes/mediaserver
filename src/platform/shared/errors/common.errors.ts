import { HttpException, HttpStatus } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

export class ApiKeyNotProvidedError extends HttpException {
  constructor(private readonly i18n: I18nService) {
    super(i18n.t('common.ApiKeyNotProvided'), HttpStatus.BAD_REQUEST);
  }
}

export class ApiKeyInvalidError extends HttpException {
  constructor(private readonly i18n: I18nService) {
    super(i18n.t('common.ApiKeyInvalid'), HttpStatus.BAD_REQUEST);
  }
}

export class ApiKeyInactiveError extends HttpException {
  constructor(private readonly i18n: I18nService) {
    super(i18n.t('common.ApiKeyInactive'), HttpStatus.BAD_REQUEST);
  }
}
