import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthRequest } from '../constants/account/auth';

/**
 * Custom parameter decorator to inject the currently authenticated JWT payload
 * directly into controller route handlers.
 *
 * @example
 * ```ts
 * @Get('profile')
 * getProfile(@User() user: { sub: string; role: string }) {
 *   return user;
 * }
 * ```
 */
export const User = createParamDecorator(
  (
    _data: unknown,
    context: ExecutionContext,
  ): { sub: string; role: string } | undefined => {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    return req.user as { sub: string; role: string } | undefined;
  },
);
