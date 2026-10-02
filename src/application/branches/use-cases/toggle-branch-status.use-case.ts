import { prisma } from '../../../infrastructure/db/prisma';
import { NotFoundError } from '../../../domain/shared/errors/domain-error';

export class ToggleBranchStatusUseCase {
  public async execute(branchId: string, isActive: boolean) {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch) {
      throw new NotFoundError('Branch', branchId);
    }

    return await prisma.branch.update({
      where: { id: branchId },
      data: { isActive },
    });
  }
}
