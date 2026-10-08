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
   * Asserts that the user holds at least one of the given permissions.
   */
  public static assertAnyPermission(
    session: UserSessionContext | null | undefined,
    permissions: PermissionCode[],
    deniedMessage?: string
  ): void {
    if (!session) {
      throw new UnauthorizedError();
    }

    const allowed = permissions.some((permission) => this.hasPermission(session, permission));
    if (!allowed) {
      throw new ForbiddenError(deniedMessage ?? 'User does not possess any of the required permissions');
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
