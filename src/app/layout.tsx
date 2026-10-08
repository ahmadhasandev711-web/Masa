import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import { PwaRegister } from './pwa-register';

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

export const metadata: Metadata = {
  title: 'قهوة كايرو | كافيه ومقهى ٢٤ ساعة',
  description: 'قهوة كايرو - كافيه ومقهى ٢٤ ساعة في ستريب مول بالعاشر من رمضان. قهوة مختصة، مشروبات ساخنة وباردة، وحلويات.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Qahwet Cairo',
  },
};

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
