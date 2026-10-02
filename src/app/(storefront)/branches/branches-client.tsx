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
    'MAIN-01': '/storefront/images/header/briana-tozour-V_Nkf1E-vYA-unsplash.jpg',
    'TAG-02': '/storefront/images/header/luisa-brimble-aFzg83dvnAI-unsplash.jpg',
    'NASR-03': '/storefront/images/header/priscilla-du-preez-W3SEyZODn8U-unsplash.jpg',
  };

  const branchAddressesEn: Record<string, string> = {
    'MAIN-01': 'Corniche El Nile, El Nasr St., Maadi, Cairo',
    'TAG-02': 'North 90th Street, 5th Settlement, New Cairo',
    'NASR-03': 'Abbas El Akkad St. & Tayaran St. Junction, Nasr City, Cairo',
  };

  const branchFeaturesAr: Record<string, string[]> = {
    'MAIN-01': ['إطلالة نيلية ساحرة', 'جلسات عائلية خاصة (VIP)', 'باركينج سيارات مجاني', 'متاح توصيل دليفري'],
    'TAG-02': ['منطقة ألعاب أطفال مؤمنة', 'تراس خارجي مفتوح (Outdoor)', 'موقف سيارات واسع', 'متاح توصيل دليفري'],
    'NASR-03': ['قريب من محاور المرور المركزية', 'صالة طعام مكيفة حديثة', 'خدمة استلام سيارات سريعة', 'متاح توصيل دليفري'],
  };

  const branchFeaturesEn: Record<string, string[]> = {
    'MAIN-01': ['Scenic Nile View', 'VIP Private Family Lounges', 'Free Dedicated Parking', 'Fast Delivery Available'],
    'TAG-02': ['Secured Kids Play Area', 'Open-Air Outdoor Terrace', 'Spacious Parking Lot', 'Fast Delivery Available'],
    'NASR-03': ['Central Arterial Access', 'Modern Air-Conditioned Hall', 'Express Drive-Thru Pickup', 'Fast Delivery Available'],
  };

  return (
    <div className="space-y-16 py-10 sm:py-16">
      {/* Header Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-8 sm:p-14 text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-400">
            <Sparkles size={14} className="text-amber-500" />
            <span>
              {isAr ? 'نحن في خدمتكم أينما كنتم في القاهرة' : 'Proudly Serving Across Greater Cairo'}
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            {isAr ? 'شبكة فروع مطعم ' : 'Branch Network — '}
            <span className="bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent">
              {brandName}
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            {isAr
              ? 'يسعدنا استقبالكم في أرقى المواقع لتجربة ضيافة استثنائية، أو توصيل طلباتكم ساخنة وطازجة إلى باب بيتكم.'
              : 'Experience our hospitality across prime locations, or enjoy fast, piping-hot delivery straight to your doorstep.'}
          </p>
        </div>
      </section>

      {/* Branches Cards Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {branches.map((branch) => {
            const photo = branchPhotos[branch.code] || '/storefront/images/header/rod-long-I79Pgmhmy5M-unsplash.jpg';
            const features = isAr
              ? branchFeaturesAr[branch.code] || ['جلسات عائلية', 'خدمة سريعة', 'توصيل دليفري']
              : branchFeaturesEn[branch.code] || ['Family Seating', 'Quick Service', 'Express Delivery'];
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
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                  <div className={`absolute top-4 ${isAr ? 'right-4' : 'left-4'}`}>
                    <span className="rounded-full bg-zinc-950/80 px-3 py-1 text-2xs font-mono font-bold text-amber-400 border border-white/10 backdrop-blur-md">
                      {branch.code}
                    </span>
                  </div>
                  <div className="absolute bottom-4 right-4 left-4">
                    <h2 className="text-xl font-black text-white">{primaryName}</h2>
                    <p className="text-2xs text-zinc-400 font-mono mt-0.5">{secondaryName}</p>
                  </div>
                </div>

                {/* Details Body */}
                <div className="flex flex-1 flex-col justify-between p-6 space-y-6">
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
                      <span>
                        {isAr
                          ? 'يومياً: 12:00 ظهراً - 02:00 بعد منتصف الليل'
                          : 'Daily: 12:00 PM - 02:00 AM'}
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
