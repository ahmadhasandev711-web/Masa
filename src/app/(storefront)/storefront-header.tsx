'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Globe, Menu, X, Coffee } from 'lucide-react';
import { useState } from 'react';
import { useCart } from './cart-context';

interface StorefrontHeaderProps {
  restaurantNameAr: string;
  restaurantNameEn: string;
}

export function StorefrontHeader({
  restaurantNameAr,
  restaurantNameEn,
}: StorefrontHeaderProps) {
  const pathname = usePathname();
  const { itemCount, locale, toggleLocale } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAr = locale === 'ar';

  const navLinks = [
    { label: isAr ? 'الرئيسية' : 'Home', href: '/' },
    { label: isAr ? 'قائمة المشروبات والمنيو' : 'Menu', href: '/menu' },
    { label: isAr ? `عن ${restaurantNameAr}` : 'Our Story', href: '/about' },
    { label: isAr ? 'الفرع والموقع' : 'Location', href: '/branches' },
    { label: isAr ? 'تواصل معنا' : 'Contact', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-zinc-950/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-amber-500/30 bg-black/60 shadow-md transition-transform group-hover:scale-105 flex items-center justify-center">
            <Image
              src="/storefront/logo.png"
              alt={isAr ? restaurantNameAr : restaurantNameEn}
              fill
              className="object-contain p-1"
              priority
              sizes="44px"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-wide text-white group-hover:text-amber-400 transition-colors">
              {isAr ? restaurantNameAr : restaurantNameEn}
            </span>
            <span className="text-3xs font-medium tracking-wider text-amber-500/90 font-mono">
              {isAr ? 'مقهى وكافيه ٢٤ ساعة • ستريب مول' : 'Specialty Coffee & Lounge 24/7'}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold tracking-wide transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <button
            onClick={toggleLocale}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900/80 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:border-white/20 hover:text-white transition-colors"
            title="تبديل اللغة / Switch Language"
          >
            <Globe className="h-3.5 w-3.5 text-amber-500" strokeWidth={1.75} />
            <span className="font-mono">{isAr ? 'EN' : 'عربي'}</span>
          </button>

          {/* Cart Floating Button */}
          <Link
            href="/cart"
            className="relative flex items-center justify-center rounded-lg bg-zinc-900 border border-white/10 p-2 text-zinc-200 hover:border-white/25 hover:text-white transition-colors"
            title={isAr ? 'سلة الطلبات' : 'Cart'}
          >
            <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-3xs font-bold text-white shadow-xs font-mono">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Order CTA */}
          <Link
            href="/menu"
            className="hidden sm:inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-95"
          >
            {isAr ? 'اطلب الآن' : 'Order Now'}
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-lg p-2 text-zinc-300 hover:text-white"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" strokeWidth={1.75} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-zinc-950 px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-white/5"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2">
            <Link
              href="/menu"
              onClick={() => setMobileMenuOpen(false)}
              className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 py-2.5 text-xs font-bold text-white"
            >
              {isAr ? 'تصفح المنيو واطلب الآن' : 'View Menu & Order'}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
