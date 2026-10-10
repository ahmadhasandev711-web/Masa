import { prisma } from '../../infrastructure/db/prisma';
import { HomeClient } from './home-client';

export default async function StorefrontHomePage() {
  const [setting, products, branches] = await Promise.all([
    prisma.restaurantSetting.findFirst(),
    prisma.product.findMany({
      where: { isActive: true },
      include: {
        sizes: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        category: { select: { nameAr: true, nameEn: true } },
      },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, code: true, nameAr: true, nameEn: true, phone: true, address: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  // Read dishes explicitly marked as featured by admin in MySQL
  const featuredOnly = products.filter((p) => p.isFeatured);
  const heroProducts = featuredOnly.length > 0 ? featuredOnly : products.slice(0, 4);

  return (
    <HomeClient
      restaurantNameAr={setting?.nameAr ?? 'المطعم'}
      restaurantNameEn={setting?.nameEn ?? 'Restaurant'}
      currencySymbol={setting?.currencySymbol ?? 'ج.م'}
      featuredProducts={products}
      heroProducts={heroProducts}
      branches={branches}
    />
  );
}
