import { prisma } from '../../../infrastructure/db/prisma';
import { CartClient } from './cart-client';

export default async function StorefrontCartPage() {
  const setting = await prisma.restaurantSetting.findFirst();

  return (
    <CartClient
      deliveryFeeMinor={setting?.deliveryFee ?? 0}
      taxRatePercent={Number(setting?.taxRatePercent ?? 0)}
      currencySymbol={setting?.currencySymbol ?? 'ج.م'}
    />
  );
}
