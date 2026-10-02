import { PermissionCode } from '../../domain/staff/enums/permission.enum';
import { ForbiddenError, UnauthorizedError } from '../../domain/shared/errors/domain-error';
import { UserSessionContext } from './branch-context.service';

export class RbacGuard {
  /**
   * Asserts that the authenticated user possesses the required capability permission.
   */
  public static assertPermission(
    session: UserSessionContext | null | undefined,
    requiredPermission: PermissionCode
  ): void {
    if (!session) {
      throw new UnauthorizedError();
    }

    if (session.isSuperAdmin) {
      return; // Super admin bypasses permission checks
    }

    if (!session.permissions.includes(requiredPermission)) {
      throw new ForbiddenError(
        `User does not possess the required permission: '${requiredPermission}'`
      );
    }
  }

  /**
   * Checks if user has permission without throwing an exception.
   */
  public static hasPermission(
    session: UserSessionContext | null | undefined,
    permission: PermissionCode
  ): boolean {
    if (!session) return false;
    if (session.isSuperAdmin) return true;
    return session.permissions.includes(permission);
  }
}
