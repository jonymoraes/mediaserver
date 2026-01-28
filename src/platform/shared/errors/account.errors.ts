import { HttpException, HttpStatus } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

export class AccountAlreadyExistsError extends HttpException {
  constructor(private readonly i18n: I18nService) {
    super(i18n.t('account.alreadyExists'), HttpStatus.BAD_REQUEST);
  }
}

export class AccountNotFoundError extends HttpException {
  constructor(private readonly i18n: I18nService) {
    super(i18n.t('account.notFound'), HttpStatus.BAD_REQUEST);
  }
}

export class AccountStorageNotFoundError extends HttpException {
  constructor(private readonly i18n: I18nService) {
    super(i18n.t('account.storageNotFound'), HttpStatus.BAD_REQUEST);
  }
}
