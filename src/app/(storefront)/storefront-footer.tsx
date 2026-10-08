'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Phone, MapPin, Clock, ShieldCheck, Coffee } from 'lucide-react';
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
  const displayAddress = address || (isAr ? 'العاشر من رمضان - ستريب مول' : 'Strip Mall, 10th of Ramadan City');

  return (
    <footer className="border-t border-white/10 bg-zinc-950 text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-amber-500/30 bg-black/60 shadow-xs flex items-center justify-center">
                <Image
                  src="/storefront/logo.png"
                  alt={isAr ? restaurantNameAr : restaurantNameEn}
                  fill
                  className="object-contain p-1"
                  sizes="40px"
                />
              </div>
              <span className="text-lg font-extrabold text-white">
                {isAr ? restaurantNameAr : restaurantNameEn}
              </span>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-zinc-400">
              {isAr
                ? 'نقدم لضيوفنا تجربة كافيه استثنائية على مدار 24 ساعة؛ قهوة مختصة، مشروبات ساخنة ومثلجة، حلويات طازجة، وجلسات مريحة ورايقة في قلب ستريب مول - العاشر من رمضان.'
                : 'Offering an exceptional 24/7 cafe experience: specialty coffee, hot & iced drinks, fresh bakery, and comfortable cozy seating in the heart of Strip Mall - 10th of Ramadan.'}
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-2xs text-amber-400 font-mono">
              <Coffee className="h-3.5 w-3.5 text-amber-400" />
              <span>{isAr ? 'قهوة كايرو • مفتوح 24 ساعة' : 'Qahwet Cairo • Open 24/7'}</span>
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
                  {isAr ? 'قائمة المشروبات والحلويات' : 'Menu'}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  {isAr ? 'عن قهوة كايرو' : 'Our Story'}
                </Link>
              </li>
              <li>
                <Link href="/branches" className="hover:text-white transition-colors">
                  {isAr ? 'موقعنا في ستريب مول' : 'Our Location'}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  {isAr ? 'تواصل معنا' : 'Contact Us'}
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white transition-colors">
                  {isAr ? 'سلة الطلبات' : 'Cart'}
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
              {isAr ? 'العنوان وساعات العمل' : 'Location & Hours'}
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" strokeWidth={1.75} />
                <span>{displayAddress}</span>
              </li>
              {phone && (
                <li className="flex items-center gap-2 font-mono">
                  <Phone className="h-4 w-4 shrink-0 text-amber-500" strokeWidth={1.75} />
                  <span dir="ltr">{phone}</span>
                </li>
              )}
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-amber-500" strokeWidth={1.75} />
                <span className="text-emerald-400 font-semibold">
                  {isAr ? 'مفتوح 24 ساعة يومياً (طوال الأسبوع)' : 'Open 24/7 Every Day'}
                </span>
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
