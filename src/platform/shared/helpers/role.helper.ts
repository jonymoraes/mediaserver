import { ExecutionContext } from '@nestjs/common';
import { Roles } from '../constants/account/roles';

/**
 * @description Get allowed roles from method or class metadata
 * @param context ExecutionContext
 * @returns Roles[]
 */
export function getAllowedRoles(context: ExecutionContext): Roles[] {
  const handlerRoles: Roles[] = Reflect.getMetadata(
    'allowedRoles',
    context.getHandler(),
  );
  const classRoles: Roles[] = Reflect.getMetadata(
    'allowedRoles',
    context.getClass(),
  );

  return Array.isArray(handlerRoles)
    ? handlerRoles
    : Array.isArray(classRoles)
      ? classRoles
      : [];
}
