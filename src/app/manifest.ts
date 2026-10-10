import type { MetadataRoute } from 'next';
import { prisma } from '../infrastructure/db/prisma';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let setting = null;
  try {
    setting = await prisma.restaurantSetting.findFirst();
  } catch {
    // safe fallback when database is initializing or during static build
  }

  const name = setting?.nameAr ? `${setting.nameAr} | نظام إدارة المطعم` : 'منظومة المطعم الذكية';
  const shortName = setting?.nameAr || 'المطعم';
  const description = setting?.nameAr
    ? `منظومة ${setting.nameAr} المتكاملة لإدارة المطاعم ونقاط البيع والصالة والتوصيل والمخزون.`
    : 'منظومة متكاملة لإدارة المطاعم ونقاط البيع والصالة والتوصيل والمخزون.';

  return {
    name,
    short_name: shortName,
    description,
    start_url: '/admin',
    scope: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#18181b',
    orientation: 'any',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}

