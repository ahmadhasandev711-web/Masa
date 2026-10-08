import React from 'react';
import { prisma } from '../../infrastructure/db/prisma';
import { CartProvider } from './cart-context';
import { StorefrontShell } from './storefront-shell';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'قهوة كايرو | كافيه ومقهى ٢٤ ساعة - ستريب مول العاشر من رمضان',
  description: 'قهوة كايرو - كافيه ومقهى ٢٤ ساعة في ستريب مول بالعاشر من رمضان. قهوة مختصة، مشروبات ساخنة وباردة، حلويات، وجلسات مريحة ورايقة.',
};

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const setting = await prisma.restaurantSetting.findFirst();

  return (
    <CartProvider>
      <StorefrontShell
        restaurantNameAr={setting?.nameAr ?? 'قهوة كايرو'}
        restaurantNameEn={setting?.nameEn ?? 'Qahwet Cairo'}
        phone={setting?.phone}
        address={setting?.address}
      >
        {children}
      </StorefrontShell>
    </CartProvider>
  );
}
