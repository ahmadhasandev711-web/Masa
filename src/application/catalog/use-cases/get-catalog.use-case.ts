import { prisma } from '../../../infrastructure/db/prisma';

export class GetCatalogUseCase {
  public async execute() {
    const [categories, products, modifierGroups, branches, settings] = await Promise.all([
      prisma.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { nameAr: 'asc' }] }),
      prisma.product.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          category: { select: { id: true, nameAr: true } },
          sizes: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
          modifierGroups: { include: { group: { select: { id: true, nameAr: true } } } },
          branchAvailability: { select: { branchId: true, isAvailable: true } },
        },
      }),
      prisma.modifierGroup.findMany({
        where: { isActive: true },
        orderBy: { nameAr: 'asc' },
        include: { modifiers: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
      }),
      prisma.branch.findMany({
        where: { isActive: true },
        select: { id: true, code: true, nameAr: true },
        orderBy: { nameAr: 'asc' },
      }),
      prisma.restaurantSetting.findFirst({ select: { currency: true } }),
    ]);

    return { categories, products, modifierGroups, branches, currency: settings?.currency ?? null };
  }
}
