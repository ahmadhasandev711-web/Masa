import { prisma } from '../../../infrastructure/db/prisma';
import { CheckoutClient } from './checkout-client';

export default async function StorefrontCheckoutPage() {
  const setting = await prisma.restaurantSetting.findFirst();

  return (
    <CheckoutClient
      deliveryFeeMinor={setting?.deliveryFee ?? 0}
      taxRatePercent={Number(setting?.taxRatePercent ?? 0)}
      currencySymbol={setting?.currencySymbol ?? 'ج.م'}
    />
  );
}
