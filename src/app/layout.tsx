import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import { PwaRegister } from './pwa-register';
import { prisma } from '../infrastructure/db/prisma';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
  preload: false, // Bilingual site: avoid duplicate preload tags for both arabic & latin subsets
});

export const viewport: Viewport = {
  themeColor: '#18181b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export async function generateMetadata(): Promise<Metadata> {
  let setting = null;
  try {
    setting = await prisma.restaurantSetting.findFirst();
  } catch {
    // safe fallback when database is initializing or during static build
  }

  const title = setting?.nameAr ? `${setting.nameAr} | المطعم والضيافة` : 'منظومة المطعم المتكاملة';
  const description = setting?.nameAr
    ? `منظومة ${setting.nameAr} لإدارة المطاعم والضيافة، نقاط البيع، المطبخ، والتوصيل.`
    : 'نظام إدارة المطاعم والضيافة، نقاط البيع، المطبخ، والتوصيل.';
  const appleTitle = setting?.nameEn || setting?.nameAr || 'Resto';

  return {
    title,
    description,
    manifest: '/manifest.webmanifest',
    icons: {
      icon: '/logo.png',
      apple: '/logo.png',
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: appleTitle,
    },
  };
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`}>
      <body className="min-h-full font-sans bg-zinc-50 text-zinc-900 antialiased flex flex-col">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
