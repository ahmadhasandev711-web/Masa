import { prisma } from '../../../infrastructure/db/prisma';
import { MenuClient } from './menu-client';

export default async function StorefrontMenuPage() {
  const [setting, categories, products] = await Promise.all([
    prisma.restaurantSetting.findFirst(),
    prisma.category.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, nameAr: true, nameEn: true },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      include: {
        sizes: {
          where: { isActive: true },
          select: { id: true, nameAr: true, nameEn: true, price: true },
          orderBy: { sortOrder: 'asc' },
        },
        category: {
          select: { id: true, nameAr: true, nameEn: true },
        },
        modifierGroups: {
          include: {
            group: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
                minSelect: true,
                maxSelect: true,
                modifiers: {
                  where: { isActive: true },
                  select: { id: true, nameAr: true, nameEn: true, priceDelta: true },
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

  return (
    <MenuClient
      categories={categories}
      products={products}
      currencySymbol={setting?.currencySymbol ?? 'ج.م'}
    />
  );
}
