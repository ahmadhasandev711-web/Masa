import { prisma } from '../../../infrastructure/db/prisma';

export class ListBranchesUseCase {
  public async execute(onlyActive: boolean = false) {
    return await prisma.branch.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { userBranches: true },
        },
      },
    });
  }
}
