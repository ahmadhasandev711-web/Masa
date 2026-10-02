'use client';

import { Phone, Mail, MapPin, Clock, HelpCircle, Utensils, Sparkles } from 'lucide-react';
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
  const hotlinePhone = phone || '01012345678';
  const mainAddress = isAr
    ? address || 'شارع النصر، المعادي، القاهرة'
    : 'Corniche El Nile, El Nasr St., Maadi, Cairo';

  const contactCards = [
    {
      icon: Phone,
      title: isAr ? 'الخط الساخن والحجوزات' : 'Hotline & Table Inquiries',
      value: hotlinePhone,
      desc: isAr ? 'متاح يومياً من 12:00 م حتى 02:00 ص' : 'Available daily from 12:00 PM to 02:00 AM',
      action: `tel:${hotlinePhone}`,
      actionLabel: isAr ? 'اتصل بنا مباشرة' : 'Call Hotline Directly',
    },
    {
      icon: Mail,
      title: isAr ? 'خدمة العملاء والشركات' : 'Customer Care & Corporate',
      value: 'info@masa.restaurant',
      desc: isAr ? 'للاستفسارات والشكاوى وشراكات الأعمال' : 'For inquiries, feedback, and business partnerships',
      action: 'mailto:info@masa.restaurant',
      actionLabel: isAr ? 'راسلنا عبر البريد' : 'Email Us Directly',
    },
    {
      icon: MapPin,
      title: isAr ? 'الإدارة والفرع الرئيسي' : 'Main Branch & Management',
      value: mainAddress,
      desc: isAr ? 'استقبال الضيوف والاجتماعات الرسمية' : 'Guest reception and formal banquets',
      action: '/branches',
      actionLabel: isAr ? 'عرض موقع الفرع' : 'View Branch Locations',
    },
    {
      icon: Clock,
      title: isAr ? 'ساعات العمل والتوصيل' : 'Operating & Delivery Hours',
      value: isAr ? '12:00 ظهراً - 02:00 فجراً' : '12:00 PM - 02:00 AM',
      desc: isAr ? 'طوال أيام الأسبوع بدون عطلات' : '7 days a week without interruption',
      action: '/menu',
      actionLabel: isAr ? 'اطلب أونلاين الآن' : 'Order Online Now',
    },
  ];

  const faqs = [
    {
      q: isAr
        ? 'هل يمكن حجز طاولات مسبقاً للعائلات والمجموعات؟'
        : 'Can we reserve VIP tables for families and groups in advance?',
      a: isAr
        ? 'نعم بكل تأكيد، نرحب بالحجوزات المسبقة للطاولات العائلية وقاعات VIP في فروعنا الثلاثة عبر الاتصال المباشر بالفرع أو تعبئة نموذج الحجز أعلاه.'
        : 'Yes, absolutely. We welcome advance bookings for VIP tables and family lounges across our 3 branches by calling the branch directly or submitting the inquiry form above.',
    },
    {
      q: isAr
        ? 'ما هي مدة توصيل الطلبات للمنازل؟'
        : 'What is the estimated delivery time for online orders?',
      a: isAr
        ? 'متوسط وقت التوصيل يتراوح بين 30 إلى 45 دقيقة حسب موقعك وبعدك عن أقرب فرع، مع ضمان استلام الطعام في حقائب حرارية مخصصة.'
        : 'Average delivery takes between 30 to 45 minutes depending on your proximity to the nearest branch, guaranteed in insulated thermal bags.',
    },
    {
      q: isAr
        ? 'هل تقدمون خدمات البوفيه والحفلات الخارجية (Catering)؟'
        : 'Do you offer on-site Catering & Private Event Buffets?',
      a: isAr
        ? 'نعم، يقدم فريق طهاة ماسا بوفيهات شواء وحفلات خارجية كاملة للشركات والمناسبات الخاصة مع معدات التقديم والطهي المباشر أمام الضيوف.'
        : 'Yes! Our culinary team caters full private banquets and corporate buffets with live open-flame cooking stations and hotel-grade service equipment.',
    },
    {
      q: isAr
        ? 'ما هي طرق الدفع المقبولة لديكم؟'
        : 'What payment methods do you accept?',
      a: isAr
        ? 'نقبل الدفع نقداً عند الاستلام، وكذلك بطاقات الدفع الإلكتروني (فيزا وماستركارد وميزة) ومحافظ الهاتف المحمولة عبر نقاط البيع المتنقلة.'
        : 'We accept Cash on Delivery as well as all major credit/debit cards (Visa, MasterCard, Meeza) and mobile electronic wallets via mobile POS.',
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
              <Utensils size={15} />
              <span>
                {isAr ? 'خدمات الحفلات والمناسبات الخاصة' : 'Catering & Private Banquets'}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white sm:text-4xl leading-tight">
              {isAr
                ? `اجعل مناسبتك ذكرى لا تُنسى مع ضيافة ${brandName}`
                : `Make Your Occasion Unforgettable with ${brandName}`}
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-zinc-300">
              {isAr
                ? 'نوفر حلول ضيافة وبوفيهات متكاملة للمؤتمرات، حفلات الزفاف، أعياد الميلاد، واللقاءات العائلية الكبرى. يقدم طهاتنا تشكيلات استثنائية من المشاوي والستيك والمقبلات مع التجهيز الفندقي الراقي.'
                : 'We deliver comprehensive catering solutions for conferences, weddings, birthdays, and large family gatherings. Our culinary crew offers prime live grills and hotel-grade presentation.'}
            </p>
            <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 space-y-3">
              <p className="text-xs font-bold text-white">
                {isAr ? 'مميزات خدمة البوفيه والـ Catering:' : 'Key Catering Privileges:'}
              </p>
              <ul className="space-y-2 text-3xs text-zinc-300">
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span>
                    {isAr
                      ? 'محطات طهي وشواء مباشر أمام الحضور (Live Cooking Stations)'
                      : 'Live open-flame cooking & carving stations for guests'}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span>
                    {isAr
                      ? 'أطقم تقديم فندقية ومشروبات ومقبلات ترحيبية'
                      : 'Hotel-grade chafing dishes, premium silverware, and welcome drinks'}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span>
                    {isAr
                      ? 'قوائم طعام مخصصة تلائم ميزانيتك وعدد ضيوفك'
                      : 'Tailored tasting menus customized to your guest count and budget'}
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
