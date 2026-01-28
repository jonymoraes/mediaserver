import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';

// Port
import { AccountPort } from 'src/domain/ports/outbound/account.port';

// Constants
import { AuthRequest, Session } from '../constants/account/auth';
import { Roles } from '../constants/account/roles';
import { getAllowedRoles } from '../helpers/role.helper';

@Injectable()
export class AuthorizeGuard implements CanActivate {
  constructor(private readonly accountPort: AccountPort) {}

  /**
   * @description
   * Guard that checks if the authenticated user has the required roles.
   * Depends on AuthenticateGuard to set `req.user`.
   *
   * Usage:
   * - @Roles(Roles.ADMIN) on controller or route
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthRequest>();

    // Must have been authenticated by AuthenticateGuard
    const authUser: Session | undefined = req.user;
    if (!authUser) {
      throw new UnauthorizedException('User not authenticated.');
    }

    // Fetch fresh account data from DB
    const account = await this.accountPort.findById(authUser.sub);
    if (!account) {
      throw new UnauthorizedException('User not found.');
    }

    // Get roles allowed on this route
    const allowedRoles: Roles[] = getAllowedRoles(context);

    // If roles are defined and user role is not in the list → forbidden
    if (allowedRoles.length && !allowedRoles.includes(account.role)) {
      throw new ForbiddenException('Not authorized.');
    }

    // Attach full account to request for downstream use
    req.user = {
      sub: String(account.id),
      role: account.role,
    };

    return true;
  }
}
