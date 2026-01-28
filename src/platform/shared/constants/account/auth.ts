import { Roles } from '../account/roles';
import { FastifyRequest } from 'fastify';

/**
 * @description Standard payload structure for JWT
 */
export interface Session {
  sub: string;
  role: Roles;
}

/**
 * @description Authenticated request
 */
export interface AuthRequest extends FastifyRequest {
  user?: Session;
  apikey?: string;
}
