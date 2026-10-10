import { prisma } from '../../../infrastructure/db/prisma';
import { CheckoutClient } from './checkout-client';

export default async function StorefrontCheckoutPage() {
  const [setting, branches] = await Promise.all([
    prisma.restaurantSetting.findFirst(),
    prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, nameAr: true, nameEn: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  return (
    <CheckoutClient
      deliveryFeeMinor={setting?.deliveryFee ?? 0}
      taxRatePercent={Number(setting?.taxRatePercent ?? 0)}
      currencySymbol={setting?.currencySymbol ?? 'ج.م'}
      restaurantNameAr={setting?.nameAr || undefined}
      restaurantNameEn={setting?.nameEn || undefined}
      branches={branches}
    />
  );
}
