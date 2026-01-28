import { SetMetadata } from '@nestjs/common';

/**
 *  @description Decorator that sets the allowed roles for a route or controller.
 */
export const Authorize = (...roles: string[]) =>
  SetMetadata('allowedRoles', roles);
