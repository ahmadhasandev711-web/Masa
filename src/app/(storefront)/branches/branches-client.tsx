'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Phone, Clock, Utensils, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
import { useCart } from '../cart-context';

interface BranchItem {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  phone: string;
  address: string;
}

interface BranchesClientProps {
  branches: BranchItem[];
  restaurantNameAr: string;
  restaurantNameEn: string;
}

export function BranchesClient({
  branches,
  restaurantNameAr,
  restaurantNameEn,
}: BranchesClientProps) {
  const { locale } = useCart();
  const isAr = locale === 'ar';

  const brandName = isAr ? restaurantNameAr : restaurantNameEn;

  const branchPhotos: Record<string, string> = {
    'MAIN-01': '/storefront/images/cafe/terrace-ambiance.jpg',
    'TAG-02': '/storefront/images/cafe/cozy-seating.jpg',
    'NASR-03': '/storefront/images/cafe/cozy-corner.jpg',
  };

  const branchAddressesEn: Record<string, string> = {
    'MAIN-01': 'Strip Mall, 10th of Ramadan City',
  };

  const branchFeaturesAr: Record<string, string[]> = {
    'MAIN-01': ['مفتوح 24 ساعة يومياً', 'جلسات داخلية وخارجية مريحة (Indoor & Outdoor)', 'إنترنت سريع ومنافذ كهرباء للعمل', 'مواقف سيارات مجانية واسعة'],
  };

  const branchFeaturesEn: Record<string, string[]> = {
    'MAIN-01': ['Open 24/7 Round The Clock', 'Cozy Indoor & Outdoor Seating', 'High-Speed Wi-Fi & Power Outlets', 'Spacious Free Parking Lot'],
  };

  return (
    <div className="space-y-16 py-10 sm:py-16">
      {/* Header Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-8 sm:p-14 text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-400">
            <Sparkles size={14} className="text-amber-500" />
            <span>
              {isAr ? 'العاشر من رمضان - ستريب مول • مفتوح 24 ساعة' : '10th of Ramadan City - Strip Mall • Open 24/7'}
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            {isAr ? 'موقع وفروع ' : 'Locations — '}
            <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
              {brandName}
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            {isAr
              ? 'يسعدنا استقبالكم في ستريب مول بالعاشر من رمضان؛ أجواء راقية وجلسات مريحة وقهوة طازجة محضرة بإتقان على مدار 24 ساعة.'
              : 'Welcome to Strip Mall, 10th of Ramadan City; cozy ambiance, relaxed seating, and fresh specialty coffee crafted 24/7.'}
          </p>
        </div>
      </section>

      {/* Branches Cards Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {branches.map((branch) => {
            const photo = branchPhotos[branch.code] || '/storefront/images/cafe/terrace-ambiance.jpg';
            const features = isAr
              ? branchFeaturesAr[branch.code] || ['مفتوح 24 ساعة', 'جلسات مريحة', 'خدمة سريعة']
              : branchFeaturesEn[branch.code] || ['Open 24/7', 'Cozy Seating', 'Quick Service'];
            const address = isAr ? branch.address : branchAddressesEn[branch.code] || branch.address;
            const primaryName = isAr ? branch.nameAr : branch.nameEn;
            const secondaryName = isAr ? branch.nameEn : branch.nameAr;

            return (
              <article
                key={branch.id}
                className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/40 shadow-xl transition-all hover:border-white/20 hover:bg-zinc-900/70"
              >
                {/* Branch Image */}
                <div className="relative aspect-16/9 w-full overflow-hidden bg-zinc-950">
                  <Image
                    src={photo}
                    alt={primaryName}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                  <div className="absolute top-4 start-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-black/60 px-3 py-1 text-2xs font-mono font-bold text-amber-400 backdrop-blur-md">
                      {branch.code}
                    </span>
                  </div>
                </div>

                {/* Details Body */}
                <div className="flex flex-1 flex-col justify-between p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                      {primaryName}
                    </h3>
                    <p className="text-2xs text-zinc-400 mt-0.5">{secondaryName}</p>
                  </div>

                  {/* Address, Phone, Hours */}
                  <div className="space-y-3.5 text-xs text-zinc-300">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" strokeWidth={1.75} />
                      <span className="leading-relaxed">{address}</span>
                    </div>

                    {branch.phone && (
                      <div className="flex items-center gap-2.5 font-mono">
                        <Phone className="h-4 w-4 shrink-0 text-amber-500" strokeWidth={1.75} />
                        <a
                          href={`tel:${branch.phone}`}
                          className="hover:text-white transition-colors"
                          dir="ltr"
                        >
                          {branch.phone}
                        </a>
                      </div>
                    )}

                    <div className="flex items-center gap-2.5">
                      <Clock className="h-4 w-4 shrink-0 text-amber-500" strokeWidth={1.75} />
                      <span className="text-emerald-400 font-semibold">
                        {isAr
                          ? 'مفتوح 24 ساعة يومياً (طوال أيام الأسبوع)'
                          : 'Open 24/7 Daily (Round The Clock)'}
                      </span>
                    </div>
                  </div>

                  {/* Amenities / Features */}
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-3xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5 font-mono">
                      {isAr ? 'ميزات وخدمات الفرع' : 'Branch Amenities & Highlights'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {features.map((feat, fIdx) => (
                        <span
                          key={fIdx}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-3xs text-zinc-300"
                        >
                          <CheckCircle2 size={11} className="text-emerald-500" />
                          <span>{feat}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action CTA */}
                  <div className="border-t border-white/10 pt-4">
                    <Link
                      href="/menu"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 py-3 text-xs font-bold text-white shadow-md hover:opacity-95 transition"
                    >
                      <Utensils size={15} />
                      <span>
                        {isAr ? 'اطلب منيو التوصيل الآن' : 'Order Delivery from Menu'}
                      </span>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Delivery Assurance Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl border border-white/10 bg-zinc-900/50 p-8 sm:p-10 backdrop-blur-md">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row text-center sm:text-right">
            <div className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <ShieldCheck size={28} />
              </div>
              <div className={isAr ? 'text-right' : 'text-left'}>
                <h3 className="text-lg font-bold text-white">
                  {isAr
                    ? 'توصيل يغطي كافة أحياء القاهرة الكبرى'
                    : 'Fast Delivery Covering All Greater Cairo'}
                </h3>
                <p className="mt-1 text-xs text-zinc-400 max-w-xl">
                  {isAr
                    ? 'أسطول من الدراجات النارية والسيارات المجهزة بحقائب حرارية للحفاظ على حرارة الوجبات وقرمشتها.'
                    : 'Our fleet of temperature-controlled delivery vehicles preserves the piping heat and crispiness of every dish.'}
                </p>
              </div>
            </div>
            <Link
              href="/menu"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-xs font-semibold text-zinc-200 hover:bg-white/10 transition"
            >
              <span>{isAr ? 'طلب دليفري فوري' : 'Order Delivery Now'}</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
