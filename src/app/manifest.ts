import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'منظومة ماسا لإدارة المطاعم | MASA Restaurant Platform',
    short_name: 'MASA OS',
    description: 'المنصة الشاملة لإدارة المطاعم، نقاط البيع، والعمليات السحابية',
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
