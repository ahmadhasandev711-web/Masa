'use client';

import { Phone, Mail, MapPin, Clock, HelpCircle, Coffee, Sparkles } from 'lucide-react';
import { useCart } from '../cart-context';
import { ContactForm } from './contact-form';

interface BranchOption {
  id: string;
  nameAr: string;
  nameEn: string;
}

interface ContactClientProps {
  branches: BranchOption[];
  restaurantNameAr: string;
  restaurantNameEn: string;
  phone?: string | null;
  address?: string | null;
}

export function ContactClient({
  branches,
  restaurantNameAr,
  restaurantNameEn,
  phone,
  address,
}: ContactClientProps) {
  const { locale } = useCart();
  const isAr = locale === 'ar';

  const brandName = isAr ? restaurantNameAr : restaurantNameEn;
  const hotlinePhone = phone || '01000000000';
  const mainAddress = isAr
    ? address || 'العاشر من رمضان - ستريب مول'
    : 'Strip Mall, 10th of Ramadan City';

  const contactCards = [
    {
      icon: Phone,
      title: isAr ? 'خدمة العملاء والاستفسار' : 'Customer Care & Inquiries',
      value: hotlinePhone,
      desc: isAr ? 'متاح على مدار 24 ساعة طوال أيام الأسبوع' : 'Available 24/7 round the clock',
      action: `tel:${hotlinePhone}`,
      actionLabel: isAr ? 'اتصل بنا مباشرة' : 'Call Directly',
    },
    {
      icon: Mail,
      title: isAr ? 'البريد الإلكتروني' : 'Email & Business',
      value: 'info@qahwetcairo.com',
      desc: isAr ? 'للاستفسارات والشكاوى ومقترحات التعاون' : 'For feedback, corporate orders, and inquiries',
      action: 'mailto:info@qahwetcairo.com',
      actionLabel: isAr ? 'راسلنا عبر البريد' : 'Email Us',
    },
    {
      icon: MapPin,
      title: isAr ? 'موقع الفرع' : 'Branch Location',
      value: mainAddress,
      desc: isAr ? 'ستريب مول، مدينة العاشر من رمضان' : 'Strip Mall, 10th of Ramadan City',
      action: '/branches',
      actionLabel: isAr ? 'عرض تفاصيل الموقع' : 'View Location',
    },
    {
      icon: Clock,
      title: isAr ? 'ساعات العمل' : 'Opening Hours',
      value: isAr ? 'مفتوح 24 ساعة يومياً' : 'Open 24/7 Daily',
      desc: isAr ? 'نستقبلكم طوال أيام الأسبوع دون توقف' : 'Serving you 7 days a week non-stop',
      action: '/menu',
      actionLabel: isAr ? 'تصفح قائمة المشروبات' : 'View Cafe Menu',
    },
  ];

  const faqs = [
    {
      q: isAr
        ? 'هل قهوة كايرو مفتوحة طوال الـ 24 ساعة؟'
        : 'Is Qahwet Cairo open 24 hours every day?',
      a: isAr
        ? 'نعم بكل تأكيد! فرعنا في ستريب مول بالعاشر من رمضان يستقبلكم على مدار 24 ساعة طوال أيام الأسبوع لتقديم أرقى المشروبات والحلويات.'
        : 'Yes, absolutely! Our Strip Mall branch in 10th of Ramadan City is open 24 hours, 7 days a week to welcome you anytime.',
    },
    {
      q: isAr
        ? 'هل تتوفر جلسات مريحة للعمل والمذاكرة؟'
        : 'Are there comfortable seating areas suitable for study and remote work?',
      a: isAr
        ? 'نعم، المكان مجهز بجلسات مريحة ورايقة، شبكة واي فاي سريعة، ومنافذ شحن لتستمتع بالعمل أو القراءة بهدوء.'
        : 'Yes, we offer cozy ergonomic seating, high-speed Wi-Fi, and power outlets designed for productive remote work and peaceful reading.',
    },
    {
      q: isAr
        ? 'هل يمكن طلب المشروبات والحلويات أونلاين؟'
        : 'Can we order drinks and desserts online for takeout or delivery?',
      a: isAr
        ? 'نعم، يمكنك تصفح المنيو الرقمي وإرسال طلبك مباشرة وسيقوم فريقنا بتجهيزه طازجاً في أسرع وقت.'
        : 'Yes! Browse our full digital menu and place your order directly. Our baristas will prepare it fresh and prompt.',
    },
    {
      q: isAr
        ? 'أين يقع فرع قهوة كايرو بالتحديد؟'
        : 'Where is Qahwet Cairo located exactly?',
      a: isAr
        ? 'يقع فرعنا في ستريب مول بمدينة العاشر من رمضان، بموقع متميز ومواقف سيارات واسعة.'
        : 'Located conveniently in Strip Mall, 10th of Ramadan City, with ample parking and easy access.',
    },
  ];

  return (
    <div className="space-y-16 py-10 sm:py-16">
      {/* Header Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-8 sm:p-14 text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-400">
            <Sparkles size={14} className="text-amber-500" />
            <span>
              {isAr
                ? 'نحن دائماً بالقرب منك ويسعدنا سماع صوتك'
                : 'We Are Always Nearby & Delighted to Hear From You'}
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            {isAr ? 'تواصل مع مطعم ' : 'Contact '}
            <span className="bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent">
              {brandName}
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            {isAr
              ? 'سواء كنت ترغب في الاستفسار عن تفاصيل قائمتنا، حجز طاولة خاصة، أو تنظيم مناسبة كبرى وبوفيه فاخر؛ فريقنا مستعد لتلبية كافة تطلعاتك.'
              : 'Whether inquiring about our menu, reserving a private table, or organizing a large-scale celebration or corporate banquet; our team is at your service.'}
          </p>
        </div>
      </section>

      {/* Quick Contact Cards */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {contactCards.map((c, idx) => {
            const Icon = c.icon;
            return (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-3xl border border-white/10 bg-zinc-900/40 p-6 backdrop-blur-md transition hover:border-white/20 hover:bg-zinc-900/70"
              >
                <div>
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-white/5 text-amber-500 mb-4 border border-white/10">
                    <Icon size={20} strokeWidth={1.75} />
                  </div>
                  <h3 className="text-sm font-bold text-white">{c.title}</h3>
                  <p className="mt-1 text-xs font-bold text-zinc-200 font-mono" dir="ltr">
                    {c.value}
                  </p>
                  <p className="mt-1 text-3xs text-zinc-400 leading-relaxed">{c.desc}</p>
                </div>
                <div className="pt-4 border-t border-white/5 mt-4">
                  <a
                    href={c.action}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition"
                  >
                    {c.actionLabel} &rarr;
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Catering & Events Inquiries Form */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
          {/* Left Column: Info */}
          <div className="space-y-5 lg:col-span-5">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500 font-mono">
              <Coffee size={15} />
              <span>
                {isAr ? 'جلسات العمل والمناسبات والضيافة' : 'Meetings, Gatherings & Hospitality'}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white sm:text-4xl leading-tight">
              {isAr
                ? `اجعل لقاءاتك أكثر تميزاً مع ضيافة ${brandName}`
                : `Elevate Your Gatherings with ${brandName}`}
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-zinc-300">
              {isAr
                ? 'نوفر خدمات ضيافة متكاملة وتجهيزات خاصة لاجتماعات العمل، جلسات المذاكرة الجماعية، وأعياد الميلاد في أجواء راقية وجلسات مريحة مع تشكيلة واسعة من القهوة والحلويات.'
                : 'We offer full coffee bar service and hospitality packages for corporate meetings, study groups, and intimate celebrations in a refined, cozy setting.'}
            </p>
            <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 space-y-3">
              <p className="text-xs font-bold text-white">
                {isAr ? 'مميزات خدمات الضيافة في قهوة كايرو:' : 'Hospitality Advantages at Qahwet Cairo:'}
              </p>
              <ul className="space-y-2 text-3xs text-zinc-300">
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span>
                    {isAr
                      ? 'باريستا محترف ومشروبات قهوة مختصة محضرة طازجة'
                      : 'Expert baristas crafting fresh specialty coffee on demand'}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span>
                    {isAr
                      ? 'جلسات هادئة مجهزة بإنترنت فائق السرعة ومنافذ كهرباء'
                      : 'Quiet zones equipped with high-speed Wi-Fi and power outlets'}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span>
                    {isAr
                      ? 'تشكيلات حلويات ومخبوزات طازجة يومياً'
                      : 'Daily freshly baked pastries and signature artisanal desserts'}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-md shadow-2xl lg:col-span-7">
            <div className="mb-6 space-y-1">
              <h3 className="text-lg font-bold text-white">
                {isAr
                  ? 'استمارة حجز المناسبات والاستفسارات'
                  : 'Event & Catering Reservation Form'}
              </h3>
              <p className="text-xs text-zinc-400">
                {isAr
                  ? 'املأ البيانات أدناه وسيتواصل معك منسق الحفلات المختص'
                  : 'Submit the details below for instant WhatsApp coordination with our catering manager'}
              </p>
            </div>
            <ContactForm branches={branches} />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
            <HelpCircle size={15} />
            <span>{isAr ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}</span>
          </div>
          <h2 className="text-2xl font-black text-white sm:text-3xl">
            {isAr ? 'إجابات عن أكثر ما يسأل عنه ضيوفنا' : 'Answers to What Our Guests Ask Most'}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-5xl mx-auto">
          {faqs.map((f, idx) => (
            <div
              key={idx}
              className={`rounded-2xl border border-white/10 bg-zinc-900/40 p-5 space-y-2 ${
                isAr ? 'text-right' : 'text-left'
              }`}
            >
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                {f.q}
              </h3>
              <p className="text-xs leading-relaxed text-zinc-400 pr-3.5 pl-3.5">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
