'use client';

import Link from 'next/link';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Truck,
  PackageCheck,
  XCircle,
  MapPin,
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  Bike,
  Phone,
} from 'lucide-react';
import { useCart } from '../../cart-context';

interface TrackerItem {
  id: string;
  productNameAr: string;
  productNameEn: string;
  sizeNameAr?: string | null;
  sizeNameEn?: string | null;
  unitPriceMinor: number;
  quantity: number;
  totalPriceMinor: number;
  modifiers: Array<{ nameAr: string; nameEn: string; priceDeltaMinor: number }>;
}

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  type: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotalMinor: number;
  deliveryFeeMinor: number;
  taxMinor: number;
  totalMinor: number;
  customerName: string | null;
  customerPhoneMasked: string | null;
  deliveryAddress?: string | null;
  deliveryNotes?: string | null;
  createdAt: Date | string;
  branch?: { nameAr: string; nameEn: string; phone: string } | null;
  driver?: { fullName: string; phone: string } | null;
  items: TrackerItem[];
}

interface OrderTrackerClientProps {
  order: OrderData;
  currencySymbol: string;
}

export function OrderTrackerClient({ order, currencySymbol }: OrderTrackerClientProps) {
  const { locale } = useCart();
  const isAr = locale === 'ar';

  const formatPrice = (minor: number) => (minor / 100).toFixed(2);

  // Status mapping
  const statusSteps = [
    { key: 'PENDING', labelAr: 'قيد المراجعة', labelEn: 'Received', icon: Clock },
    { key: 'CONFIRMED', labelAr: 'تم التأكيد', labelEn: 'Confirmed', icon: CheckCircle2 },
    { key: 'PREPARING', labelAr: 'جاري التجهيز', labelEn: 'Cooking', icon: ChefHat },
    { key: 'OUT_FOR_DELIVERY', labelAr: 'في الطريق إليك', labelEn: 'Out for Delivery', icon: Truck },
    { key: 'DELIVERED', labelAr: 'تم التسليم', labelEn: 'Delivered', icon: PackageCheck },
  ];

  const statusOrder = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const currentStatusIndex = statusOrder.indexOf(order.status);
  const isCancelled = order.status === 'CANCELLED' || order.status === 'REJECTED';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-16 space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>{isAr ? 'تم استلام طلبك بنجاح' : 'Order Received Successfully'}</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white sm:text-4xl">
          {isAr ? 'متابعة وتتبع حالة الطلب' : 'Track Your Order'}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 font-mono">
          {isAr ? 'رقم الطلب المرجعي:' : 'Reference Order #'} <span className="font-bold text-white">{order.orderNumber}</span>
        </p>
      </div>

      {/* Status Progress Track */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-6 sm:p-8 shadow-xl backdrop-blur-md">
        {isCancelled ? (
          <div className="flex items-center justify-center gap-3 py-6 text-rose-400">
            <XCircle className="h-8 w-8" />
            <div>
              <h2 className="text-base font-bold">{isAr ? 'تم إلغاء الطلب' : 'Order Cancelled'}</h2>
              <p className="text-xs text-zinc-400">{isAr ? 'يرجى التواصل مع خدمة العملاء للمساعدة' : 'Please contact customer support'}</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 text-center">
              {statusSteps.map((step) => {
                const stepIndex = statusOrder.indexOf(step.key);
                const isPassed = currentStatusIndex >= stepIndex;
                const isCurrent = currentStatusIndex === stepIndex;
                const Icon = step.icon;

                return (
                  <div key={step.key} className="flex flex-col items-center space-y-2">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all ${
                        isCurrent
                          ? 'border-amber-500 bg-amber-500 text-black shadow-lg scale-110'
                          : isPassed
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                          : 'border-white/10 bg-white/5 text-zinc-600'
                      }`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={isCurrent ? 2.5 : 1.75} />
                    </div>
                    <span
                      className={`text-2xs font-semibold ${
                        isCurrent
                          ? 'text-amber-400 font-bold'
                          : isPassed
                          ? 'text-white'
                          : 'text-zinc-500'
                      }`}
                    >
                      {isAr ? step.labelAr : step.labelEn}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Driver Info Card when Out for Delivery / Delivered */}
      {order.driver && (order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERED') && (
        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Bike className="h-6 w-6" />
            </div>
            <div>
              <span className="text-2xs font-semibold text-purple-300 block">
                {isAr ? 'كابتن التوصيل المكلف بالطلب:' : 'Delivery Captain:'}
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                {order.driver.fullName}
              </h3>
            </div>
          </div>

          <a
            href={`tel:${order.driver.phone}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-purple-700 transition"
          >
            <Phone className="h-4 w-4" />
            <span>{isAr ? 'الاتصال بالكابتن' : 'Call Captain'}</span>
            <span dir="ltr" className="font-mono text-purple-200">({order.driver.phone})</span>
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Delivery Details */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 space-y-3.5 shadow-sm">
          <h2 className="text-sm font-bold text-white border-b border-white/10 pb-2.5">
            {isAr ? 'بيانات التوصيل والعميل' : 'Delivery Details'}
          </h2>
          <div className="space-y-2 text-xs text-zinc-300">
            <div>
              <span className="text-zinc-500">{isAr ? 'العميل: ' : 'Customer: '}</span>
              <span className="font-semibold text-white">{order.customerName}</span>
            </div>
            <div>
              <span className="text-zinc-500">{isAr ? 'الهاتف: ' : 'Phone: '}</span>
              <span className="font-mono text-zinc-300" dir="ltr">{order.customerPhoneMasked}</span>
            </div>
            {order.deliveryAddress && (
              <div className="flex items-start gap-1.5 pt-1">
                <MapPin className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                <span>{order.deliveryAddress}</span>
              </div>
            )}
            {order.deliveryNotes && (
              <div className="mt-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 text-3xs text-amber-300">
                {isAr ? 'ملاحظة التوصيل: ' : 'Delivery note: '} {order.deliveryNotes}
              </div>
            )}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 space-y-3.5 shadow-sm">
          <h2 className="text-sm font-bold text-white border-b border-white/10 pb-2.5">
            {isAr ? 'الفاتورة وطريقة السداد' : 'Payment & Invoice'}
          </h2>
          <div className="space-y-2 text-xs text-zinc-300">
            <div className="flex justify-between">
              <span>{isAr ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
              <span className="font-mono">{formatPrice(order.subtotalMinor)} {currencySymbol}</span>
            </div>
            <div className="flex justify-between">
              <span>{isAr ? 'رسوم التوصيل:' : 'Delivery:'}</span>
              <span className="font-mono">{formatPrice(order.deliveryFeeMinor)} {currencySymbol}</span>
            </div>
            {order.taxMinor > 0 && (
              <div className="flex justify-between">
                <span>{isAr ? 'الضريبة:' : 'VAT:'}</span>
                <span className="font-mono">{formatPrice(order.taxMinor)} {currencySymbol}</span>
              </div>
            )}
            <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-sm text-white">
              <span>{isAr ? 'الإجمالي:' : 'Total:'}</span>
              <span className="font-mono text-rose-400">{formatPrice(order.totalMinor)} {currencySymbol}</span>
            </div>
            <div className="pt-2 text-3xs text-zinc-400">
              {isAr ? 'طريقة الدفع: نقداً عند الاستلام' : 'Payment Method: Cash on Delivery'}
            </div>
          </div>
        </div>
      </div>

      {/* Ordered Items List */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 space-y-4 shadow-sm">
        <h2 className="text-sm font-bold text-white border-b border-white/10 pb-2.5 flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-amber-500" />
          <span>{isAr ? 'الأصناف المطلوبة' : 'Ordered Items'}</span>
        </h2>
        <div className="divide-y divide-white/5 space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="pt-2 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-white">
                  {item.quantity}x {isAr ? item.productNameAr : item.productNameEn}
                </div>
                {(item.sizeNameAr || item.sizeNameEn) && (
                  <div className="text-3xs text-zinc-400">
                    {isAr ? item.sizeNameAr : item.sizeNameEn}
                  </div>
                )}
                {item.modifiers?.length > 0 && (
                  <div className="text-3xs text-amber-400 mt-0.5">
                    +{item.modifiers.map((m) => (isAr ? m.nameAr : m.nameEn)).join(', ')}
                  </div>
                )}
              </div>
              <span className="font-mono font-bold text-zinc-200">
                {formatPrice(item.totalPriceMinor)} {currencySymbol}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Return to home / Menu buttons */}
      <div className="flex items-center justify-center gap-4 pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-white/10 transition-colors"
        >
          <span>{isAr ? 'العودة للرئيسية' : 'Return Home'}</span>
        </Link>
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 transition-opacity"
        >
          <span>{isAr ? 'طلب أطباق أخرى' : 'Order More Dishes'}</span>
          {isAr ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
        </Link>
      </div>
    </div>
  );
}
