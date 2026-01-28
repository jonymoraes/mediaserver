import { HttpException, HttpStatus } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

export class ImageNotFoundError extends HttpException {
  constructor(private readonly i18n: I18nService) {
    super(i18n.t('image.notFound'), HttpStatus.BAD_REQUEST);
  }
}
