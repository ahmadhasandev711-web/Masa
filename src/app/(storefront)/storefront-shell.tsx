'use client';

import React from 'react';
import { useCart } from './cart-context';
import { StorefrontHeader } from './storefront-header';
import { StorefrontFooter } from './storefront-footer';

interface StorefrontShellProps {
  children: React.ReactNode;
  restaurantNameAr: string;
  restaurantNameEn: string;
  phone?: string | null;
  address?: string | null;
}

export function StorefrontShell({
  children,
  restaurantNameAr,
  restaurantNameEn,
  phone,
  address,
}: StorefrontShellProps) {
  const { locale } = useCart();
  const isAr = locale === 'ar';

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className={`min-h-screen flex flex-col bg-zinc-950 text-zinc-100 ${
        isAr ? 'font-sans' : 'font-sans'
      } selection:bg-rose-600 selection:text-white`}
    >
      <StorefrontHeader
        restaurantNameAr={restaurantNameAr}
        restaurantNameEn={restaurantNameEn}
      />
      <main className="flex-1">{children}</main>
      <StorefrontFooter
        restaurantNameAr={restaurantNameAr}
        restaurantNameEn={restaurantNameEn}
        phone={phone}
        address={address}
      />
    </div>
  );
}
