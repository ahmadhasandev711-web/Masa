'use client';

import Link from 'next/link';
import { Phone, MapPin, Clock, ShieldCheck, Utensils } from 'lucide-react';
import { useCart } from './cart-context';

interface StorefrontFooterProps {
  restaurantNameAr: string;
  restaurantNameEn: string;
  phone?: string | null;
  address?: string | null;
}

export function StorefrontFooter({
  restaurantNameAr,
  restaurantNameEn,
  phone,
  address,
}: StorefrontFooterProps) {
  const { locale } = useCart();
  const isAr = locale === 'ar';

  return (
    <footer className="border-t border-white/10 bg-zinc-950 text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-amber-600 text-white shadow-xs">
                <Utensils className="h-4 w-4" strokeWidth={2} />
              </div>
              <span className="text-lg font-extrabold text-white">
                {isAr ? restaurantNameAr : restaurantNameEn}
              </span>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-zinc-400">
              {isAr
                ? 'نقدم لضيوفنا تجربة طعام استثنائية تجمع بين أجود قطع اللحوم والمشاوي الفاخرة، ومكونات طازجة محضرة بأعلى معايير الإتقان والجودة.'
                : 'Providing our guests with an extraordinary dining experience combining the finest steaks, grilled dishes, and freshly prepared recipes.'}
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-2xs text-zinc-400 font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>{isAr ? 'منظومة MASA المعتمدة' : 'Powered by MASA Platform'}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              {isAr ? 'روابط سريعة' : 'Quick Links'}
            </h3>
            <ul className="mt-4 space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  {isAr ? 'الرئيسية' : 'Home'}
                </Link>
              </li>
              <li>
                <Link href="/menu" className="hover:text-white transition-colors">
                  {isAr ? 'قائمة الطعام' : 'Menu'}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  {isAr ? 'عن المطعم وقصتنا' : 'Our Story'}
                </Link>
              </li>
              <li>
                <Link href="/branches" className="hover:text-white transition-colors">
                  {isAr ? 'فروعنا وساعات العمل' : 'Our Branches'}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  {isAr ? 'تواصل معنا وحجز الحفلات' : 'Contact & Catering'}
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white transition-colors">
                  {isAr ? 'سلة التوصيل' : 'Delivery Cart'}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  {isAr ? 'بوابة الموظفين والإدارة' : 'Staff Portal'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              {isAr ? 'معلومات التواصل' : 'Contact & Hours'}
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              {address && (
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" strokeWidth={1.75} />
                  <span>{address}</span>
                </li>
              )}
              {phone && (
                <li className="flex items-center gap-2 font-mono">
                  <Phone className="h-4 w-4 shrink-0 text-amber-500" strokeWidth={1.75} />
                  <span dir="ltr">{phone}</span>
                </li>
              )}
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-amber-500" strokeWidth={1.75} />
                <span>{isAr ? 'يومياً: 12:00 م - 02:00 ص' : 'Daily: 12:00 PM - 02:00 AM'}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-white/10 pt-6 text-center text-2xs text-zinc-500">
          <p>© {new Date().getFullYear()} {isAr ? restaurantNameAr : restaurantNameEn}. {isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
        </div>
      </div>
    </footer>
  );
}
