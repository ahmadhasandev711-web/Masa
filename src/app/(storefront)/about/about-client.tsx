'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Utensils, Award, Flame, ShieldCheck, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
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
      value: '+50,000',
      label: isAr ? 'عميل وضيف استمتع بتجربتنا' : 'Delighted Guests Served',
    },
    {
      value: '3',
      label: isAr ? 'فروع في أرقى المواقع الجغرافية' : 'Prime Branch Locations',
    },
    {
      value: '100%',
      label: isAr ? 'لحوم أنجوس فاخرة طازجة يومياً' : 'Certified Prime Angus Daily',
    },
    {
      value: '4.9/5',
      label: isAr ? 'تقييم رضى العملاء والضيوف' : 'Average Guest Rating',
    },
  ];

  const pillars = [
    {
      icon: Flame,
      title: isAr ? 'شغف الشواء واللهب الحي' : 'Living Flame & Charcoal Grill',
      description: isAr
        ? 'نطهو لحومنا على الفحم الحي واللهب المباشر بدرجات حرارة مضبوطة لنمنح كل قطعة نكهة مدخنة غنية وقرمشة خارجية لا تُنسى.'
        : 'We sear our prime steaks over glowing charcoal embers to impart an unforgettable smokiness, caramelized crust, and succulent tenderness.',
    },
    {
      icon: ShieldCheck,
      title: isAr ? 'أجود المكونات الطازجة' : 'Farm-Fresh Premium Ingredients',
      description: isAr
        ? 'نختار لحوم الأنجوس المعتمدة وقطع الخضار العضوية الطازجة التي تصلنا صباح كل يوم لضمان أقصى درجات النقاء والسلامة الغذائية.'
        : 'Every ingredient is vetted for pristine freshness, from hand-trimmed steaks to locally harvested crisp greens and dairy.',
    },
    {
      icon: Award,
      title: isAr ? 'وصفات حصرية ونكهات أصيلة' : 'Signature House-Crafted Recipes',
      description: isAr
        ? 'تتبيلاتنا الخاصة وصوصات المشروم والباربيكيو والترافل محضرة يدوياً داخل مطابخنا دون أي معجونات صناعية أو مواد حافظة.'
        : 'Our gourmet marinades, velvety truffle sauces, and aged rubs are prepared completely from scratch without artificial additives.',
    },
    {
      icon: Utensils,
      title: isAr ? 'ضيافة راقية تليق بضيوفنا' : 'Warm Hospitality & Excellence',
      description: isAr
        ? 'فريق عمل مدرب ومحترف على أعلى المعايير الفندقية لتأمين خدمة سريعة وترحيب دافئ يليق بكل زائر وعائلة.'
        : 'Our team is trained to deliver warm, attentive service to ensure every visit and delivery feels truly special and effortless.',
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
                ? 'قصة الشغف والتميز في عالم الطهي'
                : 'Our Story of Culinary Passion & Excellence'}
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            {isAr ? 'عن مطعم ' : 'About '}
            <span className="bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent">
              {brandName}
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            {isAr
              ? 'انطلقت رحلتنا من إيمان راسخ بأن تجربة تناول الطعام ليست مجرد وجبة، بل لحظة بهجة تجمع الأحباب حول أطباق فاخرة محضرة بإتقان وشغف لا يهدأ.'
              : 'Our journey began with a conviction that dining is never just a meal; it is a celebration that brings loved ones together over masterfully crafted gourmet dishes.'}
          </p>
        </div>
      </section>

      {/* Narrative Section with Image */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          {/* Visual Showcase */}
          <div className="relative aspect-4/3 overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
            <Image
              src="/storefront/images/slide/jay-wennington-N_Y88TWmGwA-unsplash.jpg"
              alt={isAr ? 'أجواء مطعم ماسا' : 'MASA Restaurant Ambiance'}
              fill
              unoptimized
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 right-6 left-6 rounded-2xl border border-white/10 bg-zinc-950/80 p-4 backdrop-blur-md">
              <p className="text-xs font-bold text-white">
                {isAr
                  ? 'الفرع الرئيسي — المعادي، القاهرة'
                  : 'Main Branch — Maadi, Cairo'}
              </p>
              <p className="text-3xs text-zinc-400 mt-0.5">
                {isAr
                  ? 'أجواء استثنائية وإطلالة ساحرة على كورنيش النيل'
                  : 'Exceptional ambiance with scenic Nile Corniche surroundings'}
              </p>
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500 font-mono">
              <Utensils size={15} />
              <span>
                {isAr ? 'فلسفة المطبخ وأسرار النكهة' : 'Culinary Philosophy & Craft'}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white sm:text-4xl leading-tight">
              {isAr
                ? 'أفضل قطع اللحم الفاخر المشوية على أصولها'
                : 'Artisan Grilled Prime Cuts & Fine Steaks'}
            </h2>
            <p className="text-sm leading-relaxed text-zinc-300">
              {isAr
                ? `في ${brandName}، لا نساوم أبداً على الجودة. نقوم باستيراد أجود قطع لحم البلاك أنجوس المعتمدة ونتعامل مع مزارع محلية موثوقة لتوفير الخضراوات الطازجة صباح كل يوم.`
                : `At ${brandName}, we never compromise on quality. We source certified Black Angus beef cuts and partner with trusted local growers to receive crisp, fresh produce every single morning.`}
            </p>
            <p className="text-sm leading-relaxed text-zinc-400">
              {isAr
                ? 'يقوم طهاتنا بتعتيق اللحوم بطرق علمية دقيقة لتحقيق أقصى درجات الطراوة والنكهة المركزة، ثم نشويها على درجات حرارة متدرجة لضمان استواء مثالي يتناغم مع ذوقك الخاص.'
                : 'Our pitmasters age our meats with precision to maximize tenderness and deep concentrated flavors, then sear them over living flame for that quintessential crust and perfect doneness.'}
            </p>
            <div className="pt-2">
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 px-6 py-3 text-xs font-bold text-white shadow-md hover:opacity-95 transition"
              >
                <span>{isAr ? 'تصفح قائمة الطعام واطلب الآن' : 'Explore Menu & Order Online'}</span>
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
            {isAr ? `ركائز الجودة في ${brandName}` : `Pillars of Excellence at ${brandName}`}
          </h2>
          <p className="text-xs text-zinc-400 max-w-xl mx-auto">
            {isAr
              ? 'المعايير الصارمة التي نلتزم بها يومياً في كل طبق يُقدم لضيوفنا'
              : 'The uncompromising standards we uphold daily in every dish delivered to our guests'}
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
            {isAr ? 'جاهز لتجربة لا تُنسى؟' : 'Ready for an Exceptional Dining Experience?'}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
            {isAr
              ? 'اطلب أطباقك المفضلة الآن واستمتع بالتوصيل الفوري الساخن حتى باب بيتك.'
              : 'Order your favorite dishes online now and enjoy piping-hot delivery straight to your doorstep.'}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 px-6 py-3 text-xs font-bold text-white shadow-md hover:opacity-95"
            >
              <Utensils size={15} />
              <span>{isAr ? 'ابدأ طلبك الآن' : 'Order Now'}</span>
            </Link>
            <Link
              href="/branches"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-xs font-semibold text-zinc-200 hover:bg-white/10"
            >
              <span>{isAr ? 'استكشف شبكة فروعنا' : 'Explore Branches'}</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
