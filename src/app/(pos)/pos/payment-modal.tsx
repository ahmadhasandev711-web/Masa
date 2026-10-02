'use client';

import React, { useEffect, useRef } from 'react';
import {
  X,
  Banknote,
  CreditCard,
  Split,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calculator,
} from 'lucide-react';
import { Money } from '../../../domain/shared/value-objects/money';
import { PosPaymentMode } from '../../../domain/pos/enums';
import { PosSettings, PosTotals } from '../../../domain/pos/contracts/pos.repository';
import { OrderType } from '../../../domain/ordering/enums';

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totals: PosTotals | null;
  settings: PosSettings;
  mode: PosPaymentMode;
  setMode: (mode: PosPaymentMode) => void;
  cash: string;
  setCash: (value: string) => void;
  onCheckout: () => void;
  isPending: boolean;
  isUncertain: boolean;
  error?: string;
  orderType: OrderType;
  tableNumber?: string | null;
}

const paymentOptions = [
  { mode: PosPaymentMode.CASH, name: 'نقدي', icon: Banknote },
  { mode: PosPaymentMode.CARD, name: 'بطاقة', icon: CreditCard },
  { mode: PosPaymentMode.MIXED, name: 'مختلط', icon: Split },
];

export function PaymentModal({
  isOpen,
  onClose,
  totals,
  settings,
  mode,
  setMode,
  cash,
  setCash,
  onCheckout,
  isPending,
  isUncertain,
  error,
  orderType,
  tableNumber,
}: PaymentModalProps) {
  const cashInputRef = useRef<HTMLInputElement>(null);

  const total = Money.fromMinor(totals?.totalMinor ?? 0, settings.currency);
  let entered = Money.zero(settings.currency);
  try {
    entered = Money.fromDecimal(cash || '0', settings.currency);
  } catch {
    /* Invalid input handled on submit */
  }

  // Auto-focus cash input when modal opens in cash mode
  useEffect(() => {
    if (isOpen && mode === PosPaymentMode.CASH) {
      setTimeout(() => {
        cashInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, mode]);

  // If cash is empty, default it to total when opening
  useEffect(() => {
    if (isOpen && !cash && total.amount > 0) {
      setCash(total.toMajor().toString());
    }
  }, [isOpen, cash, total, setCash]);

  if (!isOpen) return null;

  const isCashMode = mode === PosPaymentMode.CASH;
  const isCardMode = mode === PosPaymentMode.CARD;
  const isMixedMode = mode === PosPaymentMode.MIXED;

  const isCashSufficient = entered.amount >= total.amount;
  const changeDue = isCashSufficient ? entered.subtract(total) : Money.zero(settings.currency);
  const remainingCardDue = entered.amount < total.amount ? total.subtract(entered) : Money.zero(settings.currency);

  const quickAmounts = [50, 100, 200, 500, 1000].filter(
    (val) => val >= total.toMajor()
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150"
      dir="rtl"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 bg-zinc-50/70">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-zinc-900 text-white shadow-2xs">
              <Calculator size={18} strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900">
                تحصيل الحساب وإتمام البيع
              </h3>
              <p className="text-xs text-zinc-500">
                {orderType === OrderType.DINE_IN && tableNumber
                  ? `صالة — طاولة ${tableNumber}`
                  : 'طلب سفري / كاونتر'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Total Summary Banner */}
        <div className="bg-zinc-900 text-white p-5 text-center space-y-1">
          <span className="text-xs text-zinc-400 font-medium">المبلغ الإجمالي المستحق</span>
          <div className="text-3xl font-extrabold tracking-tight font-mono text-white">
            {total.format(settings.locale)}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 font-medium border border-rose-200">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-700 block">طريقة السداد:</label>
            <div className="grid grid-cols-3 gap-2">
              {paymentOptions.map(({ mode: value, name, icon: Icon }) => {
                const isSelected = value === mode;
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={isPending}
                    onClick={() => setMode(value)}
                    className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-bold transition active:scale-95 ${
                      isSelected
                        ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    <Icon size={20} strokeWidth={1.8} />
                    <span>{name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CASH MODE CONTROLS */}
          {isCashMode && (
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 flex items-center justify-between">
                  <span>المبلغ المستلم نقداً من العميل:</span>
                  <span className="text-[11px] font-normal text-zinc-400 font-mono">
                    ({settings.currency})
                  </span>
                </label>
                <input
                  ref={cashInputRef}
                  disabled={isPending}
                  inputMode="decimal"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  placeholder={total.toMajor().toFixed(2)}
                  className="w-full h-11 text-center font-mono font-bold text-lg rounded-xl border border-zinc-300 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 transition"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="space-y-1">
                <span className="text-[11px] text-zinc-500 font-medium">مبالغ سريعة:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setCash(total.toMajor().toString())}
                    className="flex-1 py-1.5 px-2.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-xs font-mono font-bold text-zinc-800 transition shadow-2xs"
                  >
                    التمام ({total.toMajor()})
                  </button>
                  {quickAmounts.slice(0, 4).map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      disabled={isPending}
                      onClick={() => setCash(amt.toString())}
                      className="py-1.5 px-3 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-xs font-mono font-semibold text-zinc-700 transition shadow-2xs"
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Change calculation box */}
              {entered.amount > 0 && (
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between transition ${
                    isCashSufficient
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <span className="font-bold">
                    {isCashSufficient ? 'الباقي للعميل:' : 'المتبقي تحصيله:'}
                  </span>
                  <span className="text-base font-extrabold font-mono">
                    {isCashSufficient
                      ? changeDue.format(settings.locale)
                      : total.subtract(entered).format(settings.locale)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* CARD MODE NOTICE */}
          {isCardMode && (
            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 text-center space-y-1.5">
              <CreditCard size={28} className="mx-auto text-zinc-700" strokeWidth={1.5} />
              <p className="font-bold text-zinc-900">جاهز للدفع عبر نقطة البيع الإلكترونية</p>
              <p className="text-zinc-500 text-[11px]">
                مرر بطاقة العميل على جهاز الـ POS لتحصيل كامل المبلغ: {total.format(settings.locale)}
              </p>
            </div>
          )}

          {/* MIXED MODE CONTROLS */}
          {isMixedMode && (
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 block">الجزء النقدي المستلم:</label>
                <input
                  disabled={isPending}
                  inputMode="decimal"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-10 text-center font-mono font-bold text-base rounded-xl border border-zinc-300 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 transition"
                />
              </div>

              <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/70 text-indigo-950 flex items-center justify-between">
                <div>
                  <span className="font-bold block">المتبقي على البطاقة:</span>
                  <span className="text-[10px] text-indigo-700">يُسحب من بطاقة الدفع</span>
                </div>
                <span className="text-base font-extrabold font-mono">
                  {remainingCardDue.format(settings.locale)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-zinc-100 bg-zinc-50/60 px-5 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 font-semibold text-xs transition"
          >
            تراجع
          </button>
          <button
            type="button"
            disabled={isPending || (isCashMode && !isCashSufficient && entered.amount > 0)}
            onClick={onCheckout}
            className="flex-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 active:scale-98 font-bold text-sm transition shadow-sm disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>جارٍ التحصيل...</span>
              </>
            ) : isUncertain ? (
              <span>تأكيد العملية السابقة</span>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>تأكيد الدفع وإصدار الفاتورة</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
