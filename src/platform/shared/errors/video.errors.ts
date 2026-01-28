import { HttpException, HttpStatus } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

export class VideoNotFoundError extends HttpException {
  constructor(private readonly i18n: I18nService) {
    super(i18n.t('video.notFound'), HttpStatus.BAD_REQUEST);
  }
}
