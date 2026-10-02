import React from 'react';
import { prisma } from '../../infrastructure/db/prisma';
import { CartProvider } from './cart-context';
import { StorefrontShell } from './storefront-shell';

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const setting = await prisma.restaurantSetting.findFirst();

  return (
    <CartProvider>
      <StorefrontShell
        restaurantNameAr={setting?.nameAr ?? 'ماسا'}
        restaurantNameEn={setting?.nameEn ?? 'MASA'}
        phone={setting?.phone}
        address={setting?.address}
      >
        {children}
      </StorefrontShell>
    </CartProvider>
  );
}
