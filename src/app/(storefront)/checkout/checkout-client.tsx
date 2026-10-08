'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  User,
  ShieldCheck,
  AlertCircle,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { useCart } from '../cart-context';
import { placeOnlineOrderAction } from '../../actions/order.actions';

interface CheckoutClientProps {
  deliveryFeeMinor: number;
  taxRatePercent: number;
  currencySymbol: string;
}

export function CheckoutClient({
  deliveryFeeMinor,
  taxRatePercent,
  currencySymbol,
}: CheckoutClientProps) {
  const router = useRouter();
  const { items, subtotalMinor, clearCart, locale } = useCart();
  const isAr = locale === 'ar';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [area, setArea] = useState('');
  const [street, setStreet] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [apartment, setApartment] = useState('');
  const [landmark, setLandmark] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [idempotencyKey] = useState(() => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return '10000000-1000-4000-8000-100000000000';
  });

  const taxMinor = Math.round(subtotalMinor * (taxRatePercent / 100));
  const finalTotalMinor = subtotalMinor > 0 ? subtotalMinor + deliveryFeeMinor + taxMinor : 0;

  const formatPrice = (minor: number) => (minor / 100).toFixed(2);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError(isAr ? 'السلة فارغة' : 'Your cart is empty');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const orderPayload = {
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        area,
        street,
        building: building || undefined,
        floor: floor || undefined,
        apartment: apartment || undefined,
        landmark: landmark || undefined,
        deliveryNotes: deliveryNotes || undefined,
        customerNotes: customerNotes || undefined,
        idempotencyKey,
        items: items.map((item) => ({
          productId: item.productId,
          sizeId: item.sizeId,
          modifierIds: item.modifiers.map((m) => m.id),
          quantity: item.quantity,
        })),
      };

      const res = await placeOnlineOrderAction(orderPayload);

      if (!res.success) {
        setError(res.error);
        return;
      }

      clearCart();
      router.push(`/order/${res.data.orderNumber}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تنفيذ الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center space-y-4">
        <h1 className="text-xl font-bold text-white">
          {isAr ? 'لا توجد أصناف في السلة لإتمام الطلب' : 'Your cart is empty'}
        </h1>
        <div className="pt-2">
          <Link
            href="/menu"
            className="inline-flex rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 px-6 py-2.5 text-xs font-bold text-white shadow-md"
          >
            {isAr ? 'تصفح قائمة الطعام' : 'Browse Menu'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12 space-y-8">
      {/* Title */}
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
          {isAr ? 'إتمام طلب التوصيل (للضيوف)' : 'Guest Delivery Checkout'}
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          {isAr
            ? 'دون الحاجة لتسجيل حساب مسبق — أدخل بيانات التوصيل وسنتولى الباقي'
            : 'No prior registration required — enter your delivery info and we handle the rest'}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Delivery Details Form */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Customer Personal Info */}
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 text-sm font-bold text-white">
              <User className="h-4 w-4 text-rose-500" />
              <span>{isAr ? '1. بيانات الزبون والتواصل' : '1. Customer Information'}</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-2xs font-semibold text-zinc-300">
                  {isAr ? 'الاسم بالكامل *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={isAr ? 'مثال: محمد السيد' : 'e.g. John Doe'}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-950/80 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:border-rose-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-zinc-300">
                  {isAr ? 'رقم الهاتف للتوصيل *' : 'Phone Number *'}
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="01012345678"
                  dir="ltr"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-950/80 px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-zinc-600 focus:border-rose-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-2xs font-semibold text-zinc-300">
                {isAr ? 'البريد الإلكتروني (اختياري للإشعار)' : 'Email (Optional for receipt)'}
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="name@example.com"
                dir="ltr"
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-950/80 px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-zinc-600 focus:border-rose-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* 2. Delivery Address */}
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 text-sm font-bold text-white">
              <MapPin className="h-4 w-4 text-amber-500" />
              <span>{isAr ? '2. تفاصيل عنوان التوصيل' : '2. Delivery Address Details'}</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-2xs font-semibold text-zinc-300">
                  {isAr ? 'المنطقة أو الحي *' : 'Area / District *'}
                </label>
                <input
                  type="text"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder={isAr ? 'مثال: المعادي، التجمع، مدينة نصر' : 'e.g. Maadi, Downtown'}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-950/80 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-zinc-300">
                  {isAr ? 'اسم الشارع *' : 'Street Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder={isAr ? 'مثال: شارع 9، شارع النصر' : 'e.g. Main St.'}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-950/80 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-2xs font-semibold text-zinc-300">
                  {isAr ? 'رقم العمارة' : 'Building'}
                </label>
                <input
                  type="text"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="14"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-2xs font-semibold text-zinc-300">
                  {isAr ? 'الطابق' : 'Floor'}
                </label>
                <input
                  type="text"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="3"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-2xs font-semibold text-zinc-300">
                  {isAr ? 'الشقة' : 'Apartment'}
                </label>
                <input
                  type="text"
                  value={apartment}
                  onChange={(e) => setApartment(e.target.value)}
                  placeholder="12"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-2xs font-semibold text-zinc-300">
                {isAr ? 'علامة مميزة' : 'Landmark'}
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder={isAr ? 'بجوار صيدلية أو مسجد...' : 'Near pharmacy or landmark...'}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-950/80 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-2xs font-semibold text-zinc-300">
                {isAr ? 'ملاحظات التوصيل (للطيار)' : 'Delivery Instructions'}
              </label>
              <input
                type="text"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder={isAr ? 'مثال: يرجى عدم رن الجرس، الاتصال عند الوصول' : 'e.g. Call upon arrival'}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-950/80 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* 3. Kitchen Notes */}
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 space-y-4 shadow-sm">
            <label className="block text-2xs font-semibold text-zinc-300">
              {isAr ? 'ملاحظات خاصة بالمطبخ والوجبة' : 'Special Kitchen Instructions'}
            </label>
            <textarea
              rows={2}
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder={isAr ? 'أي ملاحظات تخص درجة الاستواء أو الحساسية...' : 'Any cooking preferences...'}
              className="w-full rounded-xl border border-white/10 bg-zinc-950/80 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:border-white/25 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Order Summary & Confirm */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6 space-y-4 shadow-xl backdrop-blur-md">
            <h2 className="text-base font-bold text-white border-b border-white/10 pb-3">
              {isAr ? 'ملخص الفاتورة النهائية' : 'Final Invoice'}
            </h2>

            {/* Items Mini List */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs text-zinc-300">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono text-zinc-400">{item.quantity}x</span>
                    <span className="truncate">{isAr ? item.nameAr : item.nameEn}</span>
                  </div>
                  <span className="font-mono shrink-0">
                    {formatPrice((item.priceMinor + item.modifiers.reduce((s, m) => s + m.priceDeltaMinor, 0)) * item.quantity)}{' '}
                    {currencySymbol}
                  </span>
                </div>
              ))}
            </div>

            {/* Price lines */}
            <div className="border-t border-white/10 pt-3 space-y-2 text-xs text-zinc-300">
              <div className="flex items-center justify-between">
                <span>{isAr ? 'المجموع الفرعي' : 'Subtotal'}</span>
                <span className="font-mono">{formatPrice(subtotalMinor)} {currencySymbol}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{isAr ? 'رسوم التوصيل' : 'Delivery Fee'}</span>
                <span className="font-mono">{formatPrice(deliveryFeeMinor)} {currencySymbol}</span>
              </div>
              {taxMinor > 0 && (
                <div className="flex items-center justify-between">
                  <span>{isAr ? `الضريبة (${taxRatePercent}%)` : `VAT (${taxRatePercent}%)`}</span>
                  <span className="font-mono">{formatPrice(taxMinor)} {currencySymbol}</span>
                </div>
              )}
              <div className="border-t border-white/10 pt-3 flex items-center justify-between text-sm font-bold text-white">
                <span>{isAr ? 'المطلوب سداده' : 'Total Amount'}</span>
                <span className="font-mono text-base text-rose-400">
                  {formatPrice(finalTotalMinor)} {currencySymbol}
                </span>
              </div>
            </div>

            {/* Payment Method Badge */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <div className="text-2xs text-zinc-300">
                <span className="font-bold text-white block">
                  {isAr ? 'الدفع نقداً عند الاستلام' : 'Cash on Delivery'}
                </span>
                <span>{isAr ? 'يتم الدفع لمندوب التوصيل عند استلام الوجبة' : 'Pay in cash upon arrival'}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 py-3.5 text-xs font-bold text-white shadow-xl hover:opacity-95 disabled:opacity-50 transition-opacity"
            >
              <Truck className="h-4 w-4" />
              <span>{isSubmitting ? (isAr ? 'جاري تأكيد الطلب...' : 'Submitting Order...') : (isAr ? 'تأكيد وإرسال الطلب الآن' : 'Confirm & Place Order')}</span>
            </button>

            <div className="flex items-center gap-2 pt-1 text-3xs text-zinc-400 justify-center">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>{isAr ? 'طلب مباشر وموثوق من قهوة كايرو' : 'Direct & Verified Order from Qahwet Cairo'}</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
