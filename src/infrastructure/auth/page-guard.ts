import { redirect } from 'next/navigation';
import { PermissionCode } from '../../domain/staff/enums/permission.enum';
import { SessionService } from './session.service';
import { RbacGuard } from './rbac-guard';
import { UserSessionContext } from './branch-context.service';

/**
 * Enforces page-level RBAC for Server Components in the admin panel.
 * If user is unauthenticated, redirects to /login.
 * If user lacks required capability permission, redirects to fallbackUrl (default: /admin).
 */
export async function assertPagePermission(
  requiredPermission: PermissionCode,
  fallbackUrl: string = '/admin'
): Promise<UserSessionContext> {
  const session = await SessionService.getCurrent();
  if (!session) {
    redirect('/login');
  }

  const hasAccess = RbacGuard.hasPermission(session, requiredPermission);
  if (!hasAccess) {
    redirect(fallbackUrl);
  }

  return session;
}
