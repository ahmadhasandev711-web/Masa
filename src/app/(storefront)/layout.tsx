import React from 'react';
import { prisma } from '../../infrastructure/db/prisma';
import { CartProvider } from './cart-context';
import { StorefrontShell } from './storefront-shell';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const setting = await prisma.restaurantSetting.findFirst();
  const name = setting?.nameAr ?? 'المطعم';
  return {
    title: `${name} | المنيو والطلب أونلاين`,
    description: `اطلب أونلاين واستمتع بأشهى المأكولات والمشروبات من ${name}.`,
  };
}

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const setting = await prisma.restaurantSetting.findFirst();

  return (
    <CartProvider>
      <StorefrontShell
        restaurantNameAr={setting?.nameAr ?? 'المطعم'}
        restaurantNameEn={setting?.nameEn ?? 'Restaurant'}
        phone={setting?.phone}
        address={setting?.address}
      >
        {children}
      </StorefrontShell>
    </CartProvider>
  );
}
