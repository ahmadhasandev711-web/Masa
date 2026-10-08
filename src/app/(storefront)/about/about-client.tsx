'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Coffee, Award, Sparkles, Clock, ArrowLeft, ArrowRight, Heart } from 'lucide-react';
import { useCart } from '../cart-context';

interface AboutClientProps {
  restaurantNameAr: string;
  restaurantNameEn: string;
}

export function AboutClient({ restaurantNameAr, restaurantNameEn }: AboutClientProps) {
  const { locale } = useCart();
  const isAr = locale === 'ar';

  const brandName = isAr ? restaurantNameAr : restaurantNameEn;

  const stats = [
    {
      value: '24/7',
      label: isAr ? 'مفتوح على مدار الساعة يومياً' : 'Open Round The Clock Daily',
    },
    {
      value: '+25',
      label: isAr ? 'صنف قهوة ومشروبات مميزة' : 'Artisanal Coffee & Drink Varieties',
    },
    {
      value: '100%',
      label: isAr ? 'حبوب بن مختارة ومحمصة بعناية' : 'Hand-Selected Premium Beans',
    },
    {
      value: '4.9/5',
      label: isAr ? 'تقييم رواد وعشاق القهوة' : 'Average Guest Rating',
    },
  ];

  const pillars = [
    {
      icon: Coffee,
      title: isAr ? 'أصالة البن وسحر التحميص' : 'Artisanal Roasting & Craft',
      description: isAr
        ? 'ننتقي حبوب البن بعناية فائقة ونطحنها طازجة لكل فنجان لنمنحك تجربة غنية بالنكهة والقوام المثالي.'
        : 'Carefully sourced beans, freshly ground per cup to ensure rich aromas and quintessential body.',
    },
    {
      icon: Sparkles,
      title: isAr ? 'أجواء راقية وجلسات مريحة' : 'Cozy & Comfortable Seating',
      description: isAr
        ? 'جلسات داخلية وخارجية مهيأة للعمل، المذاكرة، أو الاسترخاء واللقاءات الودية مع إنترنت فائق السرعة.'
        : 'Thoughtfully designed spaces for remote work, study sessions, and intimate talks with high-speed Wi-Fi.',
    },
    {
      icon: Clock,
      title: isAr ? 'خدمة متواصلة 24 ساعة' : '24/7 Non-Stop Service',
      description: isAr
        ? 'أبوابنا مفتوحة لكم دائماً في ستريب مول بالعاشر من رمضان لاستقبالكم وتقديم أفضل المشروبات في أي وقت.'
        : 'Open around the clock at Strip Mall, 10th of Ramadan City, to serve your coffee cravings at any hour.',
    },
    {
      icon: Heart,
      title: isAr ? 'ضيافة مصرية وكرم استقبال' : 'Warm Egyptian Hospitality',
      description: isAr
        ? 'فريق عمل ودود ومحترف يسعى لجعل كل زيارة لك في قهوة كايرو تجربة دافئة تشعرك بأنك في بيتك.'
        : 'Friendly, attentive service dedicated to making every visit to Qahwet Cairo feel welcoming and homey.',
    },
  ];

  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-16 py-10 sm:py-16">
      {/* Hero Header */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-8 sm:p-14 text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-400">
            <Sparkles size={14} className="text-amber-500" />
            <span>
              {isAr
                ? 'قصة الشغف والراحة في عالم القهوة'
                : 'Our Story of Coffee Passion & Comfort'}
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            {isAr ? 'عن ' : 'About '}
            <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
              {brandName}
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            {isAr
              ? 'انطلقت قهوة كايرو برؤية تجمع بين سحر القهوة الشرقية الأصيلة وأرقى تقنيات القهوة المختصة، في مكان صُمم لراحتكم وهدوئكم على مدار 24 ساعة.'
              : 'Qahwet Cairo blends authentic oriental coffee traditions with modern specialty brewing, inside a cozy haven open 24/7.'}
          </p>
        </div>
      </section>

      {/* Narrative Section with Image */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          {/* Visual Showcase */}
          <div className="relative aspect-4/3 overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
            <Image
              src="/storefront/images/cafe/cozy-seating.jpg"
              alt={isAr ? 'أجواء قهوة كايرو' : 'Qahwet Cairo Ambiance'}
              fill
              unoptimized
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 right-6 left-6 rounded-2xl border border-white/10 bg-zinc-950/80 p-4 backdrop-blur-md">
              <p className="text-xs font-bold text-white">
                {isAr
                  ? 'ستريب مول — العاشر من رمضان'
                  : 'Strip Mall — 10th of Ramadan City'}
              </p>
              <p className="text-3xs text-amber-400 mt-0.5 font-medium">
                {isAr
                  ? 'مفتوح 24 ساعة • جلسات مريحة وقهوة مختصة'
                  : 'Open 24/7 • Cozy seating & specialty coffee'}
              </p>
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500 font-mono">
              <Coffee size={15} />
              <span>
                {isAr ? 'فلسفة المكان وسر الفنجان' : 'Our Coffee Philosophy'}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white sm:text-4xl leading-tight">
              {isAr
                ? 'سحر الفنجان ودفء المكان في ستريب مول'
                : 'Artisan Coffee & Cozy Comfort at Strip Mall'}
            </h2>
            <p className="text-sm leading-relaxed text-zinc-300">
              {isAr
                ? `في ${brandName}، نؤمن بأن فنجان القهوة ليس مجرد مشروب، بل طقس يومي يعيد ضبط مزاجك ويمنحك لحظة صفاء تستحقها. اخترنا أن نكون في قلب العاشر من رمضان داخل ستريب مول لنقدم لكم بيئة عصرية بطابع مصري أصيل ومريح.`
                : `At ${brandName}, we believe coffee is never just a drink; it is a restorative ritual. Nestled in Strip Mall, 10th of Ramadan City, we provide a warm space celebrating Egyptian hospitality and modern specialty brews.`}
            </p>
            <p className="text-sm leading-relaxed text-zinc-400">
              {isAr
                ? 'من الإسبريسو واللاتيه الإسباني إلى القهوة التركية المحوجة والمشروبات المنعشة والحلويات الطازجة، نعتني بأدق تفاصيل التحضير لنضمن لك مذاقاً متقناً وأجواءً هادئة تناسب عملك أو لقاءاتك على مدار 24 ساعة.'
                : 'From velvety Spanish lattes to authentic Turkish coffee and fresh bakery treats, we dial in every roast and extraction to deliver supreme flavor, whenever you visit.'}
            </p>
            <div className="pt-2">
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-3 text-xs font-bold text-white shadow-md hover:opacity-95 transition"
              >
                <span>{isAr ? 'تصفح قائمة المشروبات والحلويات' : 'Explore Menu & Order Online'}</span>
                <ArrowIcon size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s, idx) => (
            <div
              key={idx}
              className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6 text-center backdrop-blur-md"
            >
              <p className="text-3xl sm:text-4xl font-black text-white font-mono">{s.value}</p>
              <p className="mt-2 text-xs text-zinc-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pillars Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-2xl font-black text-white sm:text-3xl">
            {isAr ? `ركائز التميز في ${brandName}` : `Why Guests Love ${brandName}`}
          </h2>
          <p className="text-xs text-zinc-400 max-w-xl mx-auto">
            {isAr
              ? 'معايير الاهتمام التي نحرص عليها لتقديم فنجان قهوة لا يُنسى وتجربة مريحة'
              : 'Our unwavering dedication to crafting an exceptional cafe experience'}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 transition hover:border-white/20 hover:bg-zinc-900/70"
              >
                <div className="flex size-12 items-center justify-center rounded-2xl bg-white/5 text-amber-500 mb-4 border border-white/10">
                  <Icon size={22} strokeWidth={1.75} />
                </div>
                <h3 className="text-base font-bold text-white">{p.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">{p.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 p-8 sm:p-12 text-center">
          <h2 className="text-2xl font-black text-white sm:text-3xl">
            {isAr ? 'جاهز لقعدة رايقة وفنجان قهوة مظبوط؟' : 'Ready for a Relaxing Cup of Coffee?'}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
            {isAr
              ? 'تفضل بزيارتنا في ستريب مول بالعاشر من رمضان على مدار 24 ساعة، أو اطلب مشروباتك المفضلة أونلاين.'
              : 'Visit us anytime at Strip Mall, 10th of Ramadan City, or order your favorite coffee online.'}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-3 text-xs font-bold text-white shadow-md hover:opacity-95"
            >
              <Coffee size={15} />
              <span>{isAr ? 'تصفح قائمة المشروبات' : 'View Menu'}</span>
            </Link>
            <Link
              href="/branches"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-xs font-semibold text-zinc-200 hover:bg-white/10"
            >
              <span>{isAr ? 'موقع الفرع في ستريب مول' : 'Find Our Location'}</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
