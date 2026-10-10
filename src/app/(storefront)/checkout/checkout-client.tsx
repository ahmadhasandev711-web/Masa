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
  ShoppingBag,
  Store,
} from 'lucide-react';
import { useCart } from '../cart-context';
import { placeOnlineOrderAction } from '../../actions/order.actions';

export interface BranchOption {
  id: string;
  nameAr: string;
  nameEn: string;
}

interface CheckoutClientProps {
  deliveryFeeMinor: number;
  taxRatePercent: number;
  currencySymbol: string;
  restaurantNameAr?: string;
  restaurantNameEn?: string;
  branches?: BranchOption[];
}

export function CheckoutClient({
  deliveryFeeMinor,
  taxRatePercent,
  currencySymbol,
  restaurantNameAr,
  restaurantNameEn,
  branches = [],
}: CheckoutClientProps) {
  const router = useRouter();
  const { items, subtotalMinor, clearCart, locale } = useCart();
  const isAr = locale === 'ar';

  const [orderType, setOrderType] = useState<'DELIVERY' | 'TAKEAWAY'>('DELIVERY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || '');
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

  const effectiveDeliveryFeeMinor = orderType === 'TAKEAWAY' ? 0 : deliveryFeeMinor;
  const taxMinor = Math.round(subtotalMinor * (taxRatePercent / 100));
  const finalTotalMinor = subtotalMinor > 0 ? subtotalMinor + effectiveDeliveryFeeMinor + taxMinor : 0;

  const formatPrice = (minor: number) => (minor / 100).toFixed(2);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError(isAr ? 'السلة فارغة' : 'Your cart is empty');
      return;
    }

    if (orderType === 'TAKEAWAY' && !selectedBranchId && branches.length > 0) {
      setError(isAr ? 'يرجى اختيار فرع الاستلام' : 'Please select a pickup branch');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const orderPayload = {
        type: orderType,
        branchId: selectedBranchId || undefined,
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        area: orderType === 'DELIVERY' ? area : undefined,
        street: orderType === 'DELIVERY' ? street : undefined,
        building: orderType === 'DELIVERY' ? (building || undefined) : undefined,
        floor: orderType === 'DELIVERY' ? (floor || undefined) : undefined,
        apartment: orderType === 'DELIVERY' ? (apartment || undefined) : undefined,
        landmark: orderType === 'DELIVERY' ? (landmark || undefined) : undefined,
        deliveryNotes: orderType === 'DELIVERY' ? (deliveryNotes || undefined) : undefined,
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
      {/* Title & Order Type Toggle */}
      <div className="border-b border-white/10 pb-4 space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
            {orderType === 'TAKEAWAY'
              ? (isAr ? 'إتمام طلب الاستلام من الفرع (تيك أواي)' : 'Store Pickup Checkout')
              : (isAr ? 'إتمام طلب التوصيل (للضيوف)' : 'Guest Delivery Checkout')}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {orderType === 'TAKEAWAY'
              ? (isAr ? 'استلم وجبتك ساخنة مباشرة من الفرع دون رسوم توصيل' : 'Pick up your fresh order directly from the branch with no delivery fees')
              : (isAr ? 'دون الحاجة لتسجيل حساب مسبق — أدخل بيانات التوصيل وسنتولى الباقي' : 'No prior registration required — enter your delivery info and we handle the rest')}
          </p>
        </div>

        {/* Order Type Selector */}
        <div className="grid grid-cols-2 gap-3 max-w-md pt-1">
          <button
            type="button"
            onClick={() => setOrderType('DELIVERY')}
            className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
              orderType === 'DELIVERY'
                ? 'border-rose-500 bg-rose-500/10 text-rose-300 shadow-md ring-1 ring-rose-500/30'
                : 'border-white/10 bg-zinc-900/60 text-zinc-400 hover:border-white/20 hover:text-white'
            }`}
          >
            <Truck className="h-4 w-4" />
            <span>{isAr ? 'توصيل للمنزل' : 'Home Delivery'}</span>
          </button>

          <button
            type="button"
            onClick={() => setOrderType('TAKEAWAY')}
            className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
              orderType === 'TAKEAWAY'
                ? 'border-amber-500 bg-amber-500/10 text-amber-300 shadow-md ring-1 ring-amber-500/30'
                : 'border-white/10 bg-zinc-900/60 text-zinc-400 hover:border-white/20 hover:text-white'
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>{isAr ? 'استلام من الفرع' : 'Store Pickup'}</span>
          </button>
        </div>
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
                  {isAr ? 'رقم الهاتف للتواصل *' : 'Phone Number *'}
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

            {orderType === 'TAKEAWAY' ? (
              <div>
                <label className="block text-2xs font-semibold text-zinc-300">
                  {isAr ? 'فرع استلام الطلب *' : 'Pickup Branch *'}
                </label>
                {branches.length > 1 ? (
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-950/80 px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-hidden"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id} className="bg-zinc-900 text-white">
                        {isAr ? b.nameAr : b.nameEn}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-950/80 px-3.5 py-2.5 text-xs text-zinc-200">
                    <Store className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>{branches[0] ? (isAr ? branches[0].nameAr : branches[0].nameEn) : (isAr ? 'الفرع الرئيسي' : 'Main Branch')}</span>
                  </div>
                )}
              </div>
            ) : (
              branches.length > 1 && (
                <div>
                  <label className="block text-2xs font-semibold text-zinc-300">
                    {isAr ? 'فرع تجهيز الطلب والتوصيل *' : 'Fulfillment Branch *'}
                  </label>
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-950/80 px-3.5 py-2.5 text-xs text-white focus:border-rose-500 focus:outline-hidden"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id} className="bg-zinc-900 text-white">
                        {isAr ? b.nameAr : b.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              )
            )}
          </div>

          {/* 2. Delivery Address or Pickup Notice */}
          {orderType === 'DELIVERY' ? (
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
          ) : (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
                <Store className="h-4 w-4" />
                <span>{isAr ? '2. الاستلام المباشر من الفرع' : '2. Direct Store Pickup'}</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {isAr
                  ? 'سيتم تجهيز طلبك في الفرع المحدد لتستلمه بنفسك بمجرد أن يصبح جاهزاً. لا توجد أي رسوم توصيل إضافية.'
                  : 'Your order will be prepared at the selected branch for you to pick up when ready. No additional delivery fees apply.'}
              </p>
            </div>
          )}

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
                {orderType === 'TAKEAWAY' ? (
                  <span className="text-emerald-400 font-semibold">{isAr ? 'مجاني (استلام من الفرع)' : 'Free (Store Pickup)'}</span>
                ) : (
                  <span className="font-mono">{formatPrice(deliveryFeeMinor)} {currencySymbol}</span>
                )}
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
                  {orderType === 'TAKEAWAY'
                    ? (isAr ? 'الدفع عند الاستلام بالفرع' : 'Pay on Pickup at Store')
                    : (isAr ? 'الدفع نقداً عند الاستلام' : 'Cash on Delivery')}
                </span>
                <span>
                  {orderType === 'TAKEAWAY'
                    ? (isAr ? 'يتم الدفع كاش أو بالبطاقة عند استلام الوجبة من الفرع' : 'Pay by cash or card when collecting your order at the branch')
                    : (isAr ? 'يتم الدفع لمندوب التوصيل عند استلام الوجبة' : 'Pay in cash upon arrival')}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 py-3.5 text-xs font-bold text-white shadow-xl hover:opacity-95 disabled:opacity-50 transition-opacity cursor-pointer"
            >
              {orderType === 'TAKEAWAY' ? <ShoppingBag className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
              <span>
                {isSubmitting
                  ? (isAr ? 'جاري تأكيد الطلب...' : 'Submitting Order...')
                  : (orderType === 'TAKEAWAY' ? (isAr ? 'تأكيد وإرسال طلب الاستلام' : 'Confirm Pickup Order') : (isAr ? 'تأكيد وإرسال الطلب الآن' : 'Confirm & Place Order'))}
              </span>
            </button>

            <div className="flex items-center gap-2 pt-1 text-3xs text-zinc-400 justify-center">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>
                {isAr
                  ? `طلب مباشر وموثوق من ${restaurantNameAr || 'المطعم'}`
                  : `Direct & Verified Order from ${restaurantNameEn || 'the restaurant'}`}
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
