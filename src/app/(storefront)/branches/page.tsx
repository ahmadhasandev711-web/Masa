import { prisma } from '../../../infrastructure/db/prisma';
import { BranchesClient } from './branches-client';

export default async function BranchesPage() {
  const [branches, setting] = await Promise.all([
    prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    }),
    prisma.restaurantSetting.findFirst(),
  ]);

  return (
    <BranchesClient
      branches={branches}
      restaurantNameAr={setting?.nameAr ?? 'المطعم'}
      restaurantNameEn={setting?.nameEn ?? 'Restaurant'}
    />
  );
}
