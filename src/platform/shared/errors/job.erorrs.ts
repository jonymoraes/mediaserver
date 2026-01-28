import { HttpException, HttpStatus } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

export class JobNotFoundError extends HttpException {
  constructor(private readonly i18n: I18nService) {
    super(i18n.t('job.notFound'), HttpStatus.BAD_REQUEST);
  }
}

export class JobCanceledError extends HttpException {
  constructor(private readonly i18n: I18nService) {
    super(i18n.t('job.canceled'), HttpStatus.CONFLICT);
  }
}

export class JobFailedError extends HttpException {
  constructor(private readonly i18n: I18nService) {
    super(i18n.t('job.failed'), HttpStatus.BAD_REQUEST);
  }
}

export class JobAlreadyCompletedError extends HttpException {
  constructor(private readonly i18n: I18nService) {
    super(i18n.t('job.already_completed'), HttpStatus.BAD_REQUEST);
  }
}

export class JobAlreadyCanceledError extends HttpException {
  constructor(private readonly i18n: I18nService) {
    super(i18n.t('job.already_canceled'), HttpStatus.BAD_REQUEST);
  }
}
