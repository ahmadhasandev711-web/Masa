import { prisma } from '../../../infrastructure/db/prisma';

export class ListStaffUseCase {
  public async execute() {
    return await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        fullName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        userBranches: {
          select: {
            isDefault: true,
            branch: {
              select: {
                id: true,
                code: true,
                nameAr: true,
                nameEn: true,
              },
            },
          },
        },
      },
    });
  }
}
