'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingBag,
  Trash2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Plus,
  Minus,
} from 'lucide-react';
import { useCart } from '../cart-context';

interface CartClientProps {
  deliveryFeeMinor: number;
  taxRatePercent: number;
  currencySymbol: string;
}

export function CartClient({
  deliveryFeeMinor,
  taxRatePercent,
  currencySymbol,
}: CartClientProps) {
  const { items, updateQuantity, removeItem, clearCart, subtotalMinor, locale } = useCart();
  const isAr = locale === 'ar';

  const taxMinor = Math.round(subtotalMinor * (taxRatePercent / 100));
  const finalTotalMinor = subtotalMinor > 0 ? subtotalMinor + deliveryFeeMinor + taxMinor : 0;

  const formatPrice = (minor: number) => (minor / 100).toFixed(2);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/60 text-zinc-500 shadow-md">
          <ShoppingBag className="h-8 w-8" strokeWidth={1.5} />
        </div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">
          {isAr ? 'سلة الطلبات فارغة' : 'Your Delivery Cart is Empty'}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
          {isAr
            ? 'لم تقم بإضافة أي أطباق لسلتك بعد. استكشف قائمتنا واختر وجبتك المفضلة!'
            : 'You have not added any items yet. Explore our delicious menu!'}
        </p>
        <div className="pt-4">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 px-6 py-3 text-xs font-bold text-white shadow-lg transition-transform hover:scale-105"
          >
            <span>{isAr ? 'تصفح قائمة الطعام' : 'Browse Menu'}</span>
            {isAr ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12 space-y-8">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
            {isAr ? 'سلة طلبات التوصيل' : 'Delivery Cart'}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {isAr ? 'توصيل سريع ومباشر حتى باب منزلك' : 'Fast and direct delivery to your door'}
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-zinc-400 hover:text-rose-400 transition-colors"
        >
          {isAr ? 'إفراغ السلة' : 'Clear Cart'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Items List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item, index) => {
            const modifiersTotal = item.modifiers.reduce((sum, m) => sum + m.priceDeltaMinor, 0);
            const itemUnitTotal = item.priceMinor + modifiersTotal;
            const lineTotal = itemUnitTotal * item.quantity;

            return (
              <div
                key={`${item.productId}-${item.sizeId}-${index}`}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-900/60 p-4 shadow-xs"
              >
                {/* Product Info */}
                <div className="flex items-center gap-3.5 w-full sm:w-auto">
                  {item.imageUrl && (
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-800">
                      <Image
                        src={item.imageUrl}
                        alt={isAr ? item.nameAr : item.nameEn}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {isAr ? item.nameAr : item.nameEn}
                    </h3>
                    <div className="text-xs text-zinc-400 font-medium">
                      {isAr ? item.sizeNameAr : item.sizeNameEn}
                    </div>
                    {item.modifiers.length > 0 && (
                      <div className="text-3xs text-amber-400 mt-0.5">
                        +{item.modifiers.map((m) => (isAr ? m.nameAr : m.nameEn)).join(', ')}
                      </div>
                    )}
                    <div className="text-xs font-mono font-bold text-zinc-200 mt-1 sm:hidden">
                      {formatPrice(lineTotal)} {currencySymbol}
                    </div>
                  </div>
                </div>

                {/* Quantity Controls & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto">
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
                    <button
                      onClick={() => updateQuantity(index, item.quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-300 hover:bg-white/10"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center font-mono text-xs font-bold text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(index, item.quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-300 hover:bg-white/10"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="hidden sm:block text-right font-mono text-xs font-bold text-white min-w-20">
                    {formatPrice(lineTotal)} {currencySymbol}
                  </div>

                  <button
                    onClick={() => removeItem(index)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors"
                    title={isAr ? 'حذف' : 'Remove'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Financial Summary Card */}
        <div className="lg:col-span-4">
          <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6 space-y-4 shadow-lg backdrop-blur-md">
            <h2 className="text-base font-bold text-white border-b border-white/10 pb-3">
              {isAr ? 'ملخص الحساب والتوصيل' : 'Order Summary'}
            </h2>

            <div className="space-y-2.5 text-xs text-zinc-300">
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
                  <span>{isAr ? `ضريبة القيمة المضافة (${taxRatePercent}%)` : `VAT (${taxRatePercent}%)`}</span>
                  <span className="font-mono">{formatPrice(taxMinor)} {currencySymbol}</span>
                </div>
              )}

              <div className="border-t border-white/10 pt-3 flex items-center justify-between text-sm font-bold text-white">
                <span>{isAr ? 'الإجمالي النهائي' : 'Grand Total'}</span>
                <span className="font-mono text-base text-rose-400">
                  {formatPrice(finalTotalMinor)} {currencySymbol}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/checkout"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 py-3 text-xs font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
              >
                <span>{isAr ? 'المتابعة لإتمام الطلب' : 'Proceed to Checkout'}</span>
                {isAr ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              </Link>
            </div>

            <div className="flex items-center gap-2 pt-2 text-3xs text-zinc-400 justify-center">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>{isAr ? 'دفع نقدي آمن عند الاستلام' : 'Cash on Delivery Guaranteed'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
