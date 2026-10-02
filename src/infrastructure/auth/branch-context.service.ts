import { ForbiddenError, NotFoundError } from '../../domain/shared/errors/domain-error';
import { prisma } from '../db/prisma';

export interface UserSessionContext {
  userId: string;
  role: string;
  permissions: string[];
  assignedBranchIds: string[];
  isSuperAdmin: boolean;
}

export class BranchContextService {
  /**
   * Resolves and verifies the active branch for an operation.
   * Ensures the user has explicit permission to operate within this branch.
   */
  public static async assertBranchAccess(
    session: UserSessionContext,
    requestedBranchId?: string | null
  ): Promise<string> {
    // If no branch requested, try default branch
    let targetBranchId = requestedBranchId;

    if (!targetBranchId) {
      if (session.isSuperAdmin) {
        // Super admin can select first active branch or default
        const defaultBranch = await prisma.branch.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
        });
        if (!defaultBranch) {
          throw new NotFoundError('No active branches exist in the restaurant');
        }
        return defaultBranch.id;
      }

      if (session.assignedBranchIds.length === 0) {
        throw new ForbiddenError('User is not assigned to any branch');
      }
      targetBranchId = session.assignedBranchIds[0];
    }

    // Verify branch exists and is active
    const branch = await prisma.branch.findUnique({
      where: { id: targetBranchId },
    });

    if (!branch) {
      throw new NotFoundError('Branch', targetBranchId);
    }

    if (!branch.isActive) {
      throw new ForbiddenError(`Branch '${branch.nameAr}' is currently inactive`);
    }

    // If super admin, has global branch access
    if (session.isSuperAdmin) {
      return branch.id;
    }

    // Check if user is assigned to this branch
    if (!session.assignedBranchIds.includes(branch.id)) {
      throw new ForbiddenError(`User does not have access to branch '${branch.nameAr}'`);
    }

    return branch.id;
  }
}
