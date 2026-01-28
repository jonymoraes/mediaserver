import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';

/**
 * Common exception filter for handling application-wide errors.
 *
 * Supported exceptions:
 * - {@link BadRequestException} (400) → Validation errors or invalid requests.
 * - {@link UnauthorizedException} (401) → Authentication errors (missing/invalid credentials).
 * - {@link ConflictException} (409) → Conflicts with existing resources.
 * - {@link ForbiddenException} (403) → Authorization errors (user lacks permissions).
 *
 * The filter normalizes the error response format into:
 * ```json
 * {
 *   "messages": {
 *     "field": "error message",
 *     "general": "general error description"
 *   },
 *   "statusCode": 400|401|403|409
 * }
 * ```
 *
 * This ensures consistent error structures for frontend consumption.
 */
@Catch(
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
)
export class ConfigureException implements ExceptionFilter {
  /**
   * @description Handles exceptions and returns a normalized error response.
   * @param exception Exception instance
   * @param host ArgumentsHost instance
   */
  catch(
    exception:
      | BadRequestException
      | UnauthorizedException
      | ConflictException
      | ForbiddenException,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const messages: Record<string, string> = {};

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      // Preserve status if exists
      if ('reason' in exceptionResponse) {
        messages['reason'] = String(exceptionResponse['reason']);
      }

      const validationErrors = (exceptionResponse as any).message;

      if (Array.isArray(validationErrors)) {
        validationErrors.forEach((curr: string) => {
          const [field, ...rest] = curr.split(':');
          messages[field.trim()] = rest.join(':').trim();
        });
      } else if (typeof validationErrors === 'string') {
        // Check if string contains ":" → parse field
        const [field, ...rest] = validationErrors.split(':');
        if (rest.length > 0) {
          messages[field.trim()] = rest.join(':').trim();
        } else {
          messages['general'] = validationErrors;
        }
      } else if (
        'error' in exceptionResponse &&
        typeof exceptionResponse['error'] === 'string'
      ) {
        messages['general'] = exceptionResponse['error'];
      }
    } else if (typeof exceptionResponse === 'string') {
      messages['general'] = exceptionResponse;
    } else {
      messages['general'] = 'Bad Request';
    }

    response.status(status).send({
      messages,
      statusCode: status,
    });
  }
}
