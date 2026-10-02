'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Star,
  MapPin,
  Phone,
  Clock,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  ShoppingBag,
  Sparkles,
  Flame,
  Award,
  ChefHat,
  Zap,
  Leaf,
  ShieldCheck,
  UtensilsCrossed
} from 'lucide-react';
import { useCart } from './cart-context';

interface ProductData {
  id: string;
  nameAr: string;
  nameEn: string;
  description: string | null;
  imageUrl: string | null;
  isFeatured?: boolean;
  category: {
    nameAr: string;
    nameEn: string;
  };
  sizes: Array<{
    id: string;
    nameAr: string;
    nameEn: string;
    price: number; // minor units
  }>;
}

interface BranchData {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  phone: string;
  address: string;
}

interface HomeClientProps {
  restaurantNameAr: string;
  restaurantNameEn: string;
  currencySymbol: string;
  featuredProducts: ProductData[];
  heroProducts: ProductData[];
  branches: BranchData[];
}

export function HomeClient({
  restaurantNameAr,
  restaurantNameEn,
  currencySymbol,
  featuredProducts,
  heroProducts,
  branches,
}: HomeClientProps) {
  const { locale, addItem } = useCart();
  const isAr = locale === 'ar';

  // Hero Carousel State
  const heroSlides = useMemo(() => {
    if (!heroProducts || heroProducts.length === 0) {
      return [];
    }
    return heroProducts.map((prod, idx) => {
      const branch = branches.length > 0 ? branches[idx % branches.length] : null;
      const baseSize = prod.sizes[0];
      const priceMinor = baseSize ? baseSize.price : 0;
      const priceFormatted = (priceMinor / 100).toFixed(2);
      return {
        productId: prod.id,
        product: prod,
        titleAr: prod.nameAr,
        titleEn: prod.nameEn,
        price: priceFormatted,
        rating: '4.9/5',
        locationAr: branch ? branch.nameAr : (isAr ? 'الفرع الرئيسي' : 'Main Branch'),
        locationEn: branch ? branch.nameEn : 'Main Branch',
        image: prod.imageUrl || '/storefront/images/slide/jay-wennington-N_Y88TWmGwA-unsplash.jpg',
      };
    });
  }, [heroProducts, branches, isAr]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Auto advance slide
  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const handleOpenAddModal = (prod: ProductData) => {
    setSelectedProduct(prod);
    setSelectedSizeId(prod.sizes[0]?.id ?? '');
    setQuantity(1);
    setIsModalOpen(true);
  };

  const handleConfirmAddToCart = () => {
    if (!selectedProduct) return;
    const size = selectedProduct.sizes.find((s) => s.id === selectedSizeId) || selectedProduct.sizes[0];
    if (!size) return;

    addItem({
      productId: selectedProduct.id,
      sizeId: size.id,
      nameAr: selectedProduct.nameAr,
      nameEn: selectedProduct.nameEn,
      sizeNameAr: size.nameAr,
      sizeNameEn: size.nameEn,
      priceMinor: size.price,
      quantity,
      modifiers: [],
      imageUrl: selectedProduct.imageUrl,
    });

    setIsModalOpen(false);
  };

  const top6Products = featuredProducts.slice(0, 6);

  const arReviews = [
    { name: 'أحمد محمود', text: 'أفضل ستيك جربته في حياتي، اللحم طازج والطعم لا يُنسى!', rating: 5 },
    { name: 'سارة العلي', text: 'خدمة التوصيل سريعة جداً والطلب وصل ساخناً وشهياً', rating: 5 },
    { name: 'محمد الشريف', text: 'المنيو الرقمي رائع وسهل الاستخدام، طلبت في ثواني', rating: 5 },
    { name: 'نورا أحمد', text: 'مطعم استثنائي، الجو رائع والأكل يستحق كل ريال', rating: 5 },
    { name: 'خالد السعيد', text: 'الكريسبي برجر هو الأفضل على الإطلاق في القاهرة', rating: 5 },
    { name: 'فاطمة رشيد', text: 'الحلويات لذيذة جداً والعرض يستحق التجربة', rating: 5 },
  ];
  const enReviews = [
    { name: 'Ahmed M.', text: 'Best steak I\'ve ever had, perfectly fresh and unforgettable!', rating: 5 },
    { name: 'Sara A.', text: 'Super fast delivery, food arrived hot and delicious!', rating: 5 },
    { name: 'Mohamed S.', text: 'The digital menu is amazing, ordered in seconds!', rating: 5 },
    { name: 'Nora K.', text: 'Exceptional restaurant, great atmosphere and even better food!', rating: 5 },
    { name: 'Khaled B.', text: 'Best crispy burger in Cairo — period!', rating: 5 },
    { name: 'Fatma R.', text: 'Desserts are incredible, absolutely worth every visit!', rating: 5 },
  ];
  const reviews = isAr ? arReviews : enReviews;
  const marqueeReviews = [...reviews, ...reviews];

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover scale-105 filter brightness-75"
          >
            <source src="/storefront/video/hero.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/50 backdrop-blur-[2px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24 w-full">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Col: Headings & CTA */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-start">
              <div className="animate-fadeInUp inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1 text-xs font-semibold text-rose-400 backdrop-blur-md">
                <Flame className="h-3.5 w-3.5 text-rose-500" />
                <span>
                  {isAr ? 'أشهى المشاوي والستيك الفاخر في القاهرة' : 'Best Prime Steaks & Grills'}
                </span>
              </div>

              <h1 className="animate-fadeInUp delay-100 text-4xl font-extrabold tracking-tight text-white sm:text-6xl sm:leading-tight">
                {isAr ? (
                  <>
                    طعم المقرمشات <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">
                      ولذة الشواء الحقيقي
                    </span>
                  </>
                ) : (
                  <>
                    Delicious Steaks <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">
                      & Fine Dining
                    </span>
                  </>
                )}
              </h1>

              <p className="animate-fadeInUp delay-200 max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base">
                {isAr
                  ? `مرحباً بكم في مطعم ${restaurantNameAr}؛ حيث تلتقي أجود قطع اللحوم الطازجة بالوصفات السرية الفريدة لنقدم لكم تجربة استثنائية تصلكم أينما كنتم.`
                  : `Welcome to ${restaurantNameEn}; where prime cuts meet exceptional culinary passion to deliver an unforgettable dining and delivery experience.`}
              </p>

              <div className="animate-fadeInUp delay-300 flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md">
                  <span className="text-sm font-bold text-white font-mono">4.9/5</span>
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-zinc-400">
                  {isAr ? 'من أكثر من 1,200+ تقييم معتمد للعملاء' : 'From 1,200+ Verified Customer Reviews'}
                </span>
              </div>

              <div className="animate-fadeInUp delay-400 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-4">
                <Link
                  href="/menu"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>{isAr ? 'تصفح قائمة الطعام واطلب' : 'Explore Menu & Order'}</span>
                  {isAr ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                </Link>

                <a
                  href="#story"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/10 transition-colors"
                >
                  <span>{isAr ? `قصة مطعم ${restaurantNameAr}` : `About ${restaurantNameEn}`}</span>
                </a>
              </div>
            </div>

            {/* Right Col: Hero Carousel Card */}
            {heroSlides.length > 0 && (() => {
              const activeSlide = heroSlides[currentSlide % heroSlides.length];
              return (
                <div className="lg:col-span-6 animate-fadeInUp delay-300">
                  <div className="relative mx-auto max-w-lg overflow-hidden rounded-2xl border border-white/15 bg-zinc-900/80 shadow-2xl backdrop-blur-xl">
                    <div
                      onClick={() => handleOpenAddModal(activeSlide.product)}
                      className="relative h-64 sm:h-80 w-full overflow-hidden cursor-pointer group"
                    >
                      <Image
                        src={activeSlide.image}
                        alt={activeSlide.titleAr}
                        fill
                        priority
                        loading="eager"
                        sizes="(max-width: 768px) 100vw, 500px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

                      <div className="absolute top-4 start-4 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-3 py-1 text-2xs font-medium text-white backdrop-blur-md">
                        <MapPin className="h-3 w-3 text-rose-400" />
                        <span>
                          {isAr ? activeSlide.locationAr : activeSlide.locationEn}
                        </span>
                      </div>

                      <div className="absolute bottom-4 end-4 flex items-baseline gap-1 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 px-3 py-1.5 text-white shadow-md font-mono">
                        <span className="text-base font-bold">{activeSlide.price}</span>
                        <span className="text-xs font-normal">{currencySymbol}</span>
                      </div>
                    </div>

                    <div className="p-5 flex items-center justify-between">
                      <div
                        onClick={() => handleOpenAddModal(activeSlide.product)}
                        className="cursor-pointer group flex-1"
                      >
                        <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                          {isAr ? activeSlide.titleAr : activeSlide.titleEn}
                        </h3>
                        <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                          <div className="flex text-amber-400">
                            <Star className="h-3 w-3 fill-amber-400" />
                          </div>
                          <span className="font-mono font-bold text-zinc-200">
                            {activeSlide.rating}
                          </span>
                          <span>•</span>
                          <span className="text-amber-400 font-semibold">{isAr ? 'عرض مميز بالسلايدر' : 'Featured Offer'}</span>
                        </div>
                      </div>

                      {heroSlides.length > 1 && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() =>
                              setCurrentSlide(
                                (prev) => (prev - 1 + heroSlides.length) % heroSlides.length
                              )
                            }
                            className="rounded-lg border border-white/10 bg-white/5 p-2 text-zinc-300 hover:bg-white/15 hover:text-white transition-colors"
                            title="السابق"
                          >
                            {isAr ? (
                              <ChevronRight className="h-4 w-4" />
                            ) : (
                              <ChevronLeft className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() =>
                              setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
                            }
                            className="rounded-lg border border-white/10 bg-white/5 p-2 text-zinc-300 hover:bg-white/15 hover:text-white transition-colors"
                            title="التالي"
                          >
                            {isAr ? (
                              <ChevronLeft className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                    {heroSlides.length > 1 && (
                      <div className="h-1 w-full bg-white/10">
                        <div
                          key={currentSlide}
                          className="h-full bg-gradient-to-r from-rose-500 to-amber-500 animate-progress"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* 2. STATS BAR (NEW) */}
      <section className="bg-zinc-900/80 border-y border-white/10 backdrop-blur-md py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="animate-fadeInUp delay-100 p-4 rounded-xl hover:animate-pulse-glow transition-all duration-300 border border-transparent hover:border-rose-500/30">
              <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">50,000+</div>
              <div className="text-sm font-medium text-zinc-400 mt-1">{isAr ? 'عميل سعيد' : 'Happy Customers'}</div>
            </div>
            <div className="animate-fadeInUp delay-200 p-4 rounded-xl hover:animate-pulse-glow transition-all duration-300 border border-transparent hover:border-rose-500/30">
              <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">4.9/5</div>
              <div className="text-sm font-medium text-zinc-400 mt-1">{isAr ? 'تقييم' : 'Rating'}</div>
            </div>
            <div className="animate-fadeInUp delay-300 p-4 rounded-xl hover:animate-pulse-glow transition-all duration-300 border border-transparent hover:border-rose-500/30">
              <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">3</div>
              <div className="text-sm font-medium text-zinc-400 mt-1">{isAr ? 'فروع' : 'Branches'}</div>
            </div>
            <div className="animate-fadeInUp delay-400 p-4 rounded-xl hover:animate-pulse-glow transition-all duration-300 border border-transparent hover:border-rose-500/30">
              <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">{isAr ? '30 دقيقة' : '30 Min'}</div>
              <div className="text-sm font-medium text-zinc-400 mt-1">{isAr ? 'متوسط التوصيل' : 'Avg Delivery'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS (REBUILT) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isAr ? 'أطباق حصرية ومختارة' : 'Special Menus'}</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
            {isAr ? 'قائمة أطباق ماسا الأكثر طلباً' : 'Signature Culinary Creations'}
          </h2>
          <p className="max-w-xl mx-auto text-xs sm:text-sm text-zinc-400">
            {isAr
              ? 'مجموعة مختارة بعناية من أفضل ما يقدمه مطبخنا يومياً، بمكونات طازجة 100% وأسعار دقيقة.'
              : 'Handcrafted daily by our master chefs with 100% fresh ingredients and passion.'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {top6Products.map((prod, index) => {
            const minPrice = prod.sizes[0]?.price ?? 0;
            return (
              <div
                key={prod.id}
                className="animate-fadeInUp group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 transition-all duration-300 hover:-translate-y-2 hover:border-rose-500/30 hover:shadow-rose-500/10 hover:shadow-xl"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div>
                  <div className="relative h-48 w-full overflow-hidden bg-zinc-800">
                    {prod.imageUrl ? (
                      <Image
                        src={prod.imageUrl}
                        alt={isAr ? prod.nameAr : prod.nameEn}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-zinc-600">
                        <ShoppingBag className="h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />

                    <div className="absolute top-3 end-3">
                      <span className="rounded-full bg-gradient-to-r from-rose-600 to-amber-600 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
                        {isAr ? 'الأكثر طلباً' : 'Best Seller'}
                      </span>
                    </div>

                    <div className="absolute top-3 start-3">
                      <span className="rounded-md border border-amber-500/30 bg-amber-500/20 px-2.5 py-1 text-3xs font-bold text-amber-300 backdrop-blur-md">
                        {isAr ? prod.category.nameAr : prod.category.nameEn}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                      {isAr ? prod.nameAr : prod.nameEn}
                    </h3>
                    <p className="line-clamp-2 text-xs leading-relaxed text-zinc-400">
                      {prod.description || (isAr ? 'طبق شهي محضر طازجاً من أجود المكونات' : 'Freshly prepared')}
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/10 p-4 pt-3 flex items-center justify-between">
                  <div className="font-mono flex items-baseline gap-1 text-white">
                    <span className="text-lg font-bold">{(minPrice / 100).toFixed(2)}</span>
                    <span className="text-xs text-zinc-400">{currencySymbol}</span>
                  </div>

                  <button
                    onClick={() => handleOpenAddModal(prod)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gradient-to-r hover:from-rose-600 hover:to-amber-600 shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                    <span>{isAr ? 'أضف للطلب' : 'Add to Order'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/menu"
            className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 px-8 py-4 text-sm font-bold text-white shadow-lg hover:opacity-90 transition hover:scale-[1.02]"
          >
            <UtensilsCrossed size={18} />
            <span>{isAr ? 'استعرض القائمة الكاملة' : 'View Full Digital Menu'}</span>
            {isAr ? <ArrowLeft /> : <ArrowRight />}
          </Link>
        </div>
      </section>

      {/* 4. SOCIAL PROOF MARQUEE (NEW) */}
      <section className="py-12 bg-zinc-900/50 border-y border-white/10 overflow-hidden">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-semibold text-zinc-300">
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            <span>{isAr ? 'آراء موثقة من عملائنا' : 'Verified Guest Reviews'}</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white mt-4 sm:text-3xl">
            {isAr ? 'ماذا يقول ضيوفنا' : 'What Our Guests Say'}
          </h2>
        </div>
        
        <div className="relative w-full overflow-hidden flex items-center">
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-zinc-950 to-transparent z-10"></div>
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-zinc-950 to-transparent z-10"></div>
          
          <div className="animate-marquee flex gap-4 w-max hover:[animation-play-state:paused]">
            {marqueeReviews.map((review, i) => (
              <div key={i} className="w-80 p-5 rounded-2xl bg-zinc-900 border border-white/10 flex-shrink-0">
                <div className="flex text-amber-400 mb-3">
                  {[...Array(review.rating)].map((_, idx) => (
                    <Star key={idx} className="h-4 w-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-zinc-300 mb-4 h-10 line-clamp-2 italic">&ldquo;{review.text}&rdquo;</p>
                <div className="font-bold text-sm text-white">{review.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. WHY US (NEW) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: ChefHat, titleAr: 'وصفات سرية فاخرة', titleEn: 'Signature Secret Recipes', descAr: 'طعم لا يقاوم بكل تفاصيله', descEn: 'Irresistible taste in every detail' },
            { icon: Zap, titleAr: 'توصيل خلال 30 دقيقة', titleEn: '30-Min Fast Delivery', descAr: 'طعامك ساخن في الوقت المحدد', descEn: 'Hot food right on time' },
            { icon: Leaf, titleAr: 'مكونات طازجة 100%', titleEn: '100% Fresh Ingredients', descAr: 'جودة لا نساوم عليها', descEn: 'Uncompromised quality' },
            { icon: ShieldCheck, titleAr: 'ضمان جودة معتمد', titleEn: 'Certified Quality Guarantee', descAr: 'أعلى معايير النظافة والسلامة', descEn: 'Highest hygiene standards' }
          ].map((feature, i) => (
            <div key={i} className="animate-fadeInUp rounded-2xl p-6 bg-zinc-900/60 border border-white/10 text-center flex flex-col items-center gap-3" style={{ animationDelay: `${(i+1) * 0.1}s` }}>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-rose-600/20 to-amber-600/20 flex items-center justify-center border border-rose-500/30">
                <feature.icon className="h-6 w-6 text-rose-400" />
              </div>
              <h3 className="font-bold text-white text-sm">{isAr ? feature.titleAr : feature.titleEn}</h3>
              <p className="text-xs text-zinc-400">{isAr ? feature.descAr : feature.descEn}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. OUR STORY SECTION */}
      <section id="story" className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 p-8 sm:p-12 lg:p-16">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400">
                <Award className="h-3.5 w-3.5" />
                <span>{isAr ? 'حكاية وشغف ماسا' : 'Our Culinary Heritage'}</span>
              </div>

              <h2 className="text-3xl font-extrabold text-white sm:text-4xl sm:leading-tight">
                {isAr
                  ? 'رحلة النكهة من لهب الشواية إلى مائدتكم'
                  : 'From Charcoal Grills Directly to Your Table'}
              </h2>

              <p className="text-xs sm:text-sm leading-relaxed text-zinc-300">
                {isAr
                  ? 'انطلقت علامة ماسا برؤية واضحة: تقديم قطع اللحم الممتازة والمشاوي الغنية بأعلى درجات الطزاجة والإتقان، دون مساومة على معايير الجودة. نحرص على انتقاء مصادر اللحوم المعتمدة والمكونات الطبيعية يومياً لنضمن لك في كل وجبة مذاقاً فريداً يترك أثراً.'
                  : 'MASA Kitchen was founded on a simple promise: exceptional grilled meats and fresh ingredients prepared with passion, precision, and unwavering quality standards.'}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-bold text-amber-400 font-mono">100%</div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    {isAr ? 'لحوم طازجة يومياً' : 'Daily Fresh Cuts'}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-bold text-rose-400 font-mono">30+</div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    {isAr ? 'دقيقة متوسط التوصيل' : 'Mins Average Delivery'}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative h-72 sm:h-96 w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
              <Image
                src="/storefront/images/slide/jay-wennington-N_Y88TWmGwA-unsplash.jpg"
                alt="Story"
                fill
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 600px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* 7. BRANCHES & CONTACT SECTION */}
      <section id="branches" className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-300">
            <MapPin className="h-3.5 w-3.5 text-rose-500" />
            <span>{isAr ? 'زورونا في فروعنا' : 'Visit Our Locations'}</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
            {isAr ? 'فروع مطعم ماسا الميدانية' : 'Our Physical Branches'}
          </h2>
          <p className="max-w-xl mx-auto text-xs sm:text-sm text-zinc-400">
            {isAr
              ? 'فروع مجهزة لاستقبالكم وتقديم أسرع خدمة توصيل إلى كافة أنحاء المدينة.'
              : 'Modern branches ready to serve you dine-in or fast door-to-door delivery.'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 space-y-4 shadow-sm hover:border-white/20 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">
                  {isAr ? b.nameAr : b.nameEn}
                </h3>
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-2xs font-mono text-zinc-300">
                  {b.code}
                </span>
              </div>

              <div className="space-y-2 text-xs text-zinc-400">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" strokeWidth={1.75} />
                  <span>{b.address}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <Phone className="h-4 w-4 shrink-0 text-amber-500" strokeWidth={1.75} />
                  <span dir="ltr">{b.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-amber-500" strokeWidth={1.75} />
                  <span>{isAr ? '12:00 م - 02:00 ص' : '12:00 PM - 02:00 AM'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MODAL: Add to Cart & Size Selection */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-zinc-900 p-6 text-zinc-100 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              {isAr ? selectedProduct.nameAr : selectedProduct.nameEn}
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              {isAr ? 'اختر المقاس والكمية المطلوبة' : 'Choose desired size and quantity'}
            </p>

            <div className="mt-4 space-y-2">
              <label className="text-2xs font-bold text-zinc-400 uppercase tracking-wider">
                {isAr ? 'المقاس / الوجبة' : 'Size / Portion'}
              </label>
              <div className="space-y-1.5">
                {selectedProduct.sizes.map((s) => {
                  const isSelected = selectedSizeId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSizeId(s.id)}
                      className={`flex w-full items-center justify-between rounded-xl border p-3 text-xs transition-colors ${
                        isSelected
                          ? 'border-rose-500 bg-rose-500/10 text-white font-bold'
                          : 'border-white/10 bg-white/5 text-zinc-300 hover:border-white/20'
                      }`}
                    >
                      <span>{isAr ? s.nameAr : s.nameEn}</span>
                      <span className="font-mono">
                        {(s.price / 100).toFixed(2)} {currencySymbol}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-xs font-medium text-zinc-300">
                {isAr ? 'الكمية' : 'Quantity'}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-white hover:bg-white/15"
                >
                  -
                </button>
                <span className="font-mono text-sm font-bold text-white">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-white hover:bg-white/15"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/5"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmAddToCart}
                className="rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:opacity-95"
              >
                {isAr ? 'تأكيد الإضافة للسلة' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
