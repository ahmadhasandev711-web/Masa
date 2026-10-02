'use client';

import { useState } from 'react';
import { Minus, Plus, ShoppingCart, Armchair, Users, X } from 'lucide-react';
import { PosProduct, PosSelection, PosSettings, PosTotals } from '../../../domain/pos/contracts/pos.repository';
import { Money } from '../../../domain/shared/value-objects/money';
import { OrderType } from '../../../domain/ordering/enums';
import { TableItemView } from '../../../application/tables/use-cases/list-tables.use-case';

export interface PosCartProps {
  items: PosSelection[];
  products: PosProduct[];
  settings: PosSettings;
  totals: PosTotals | null;
  locked: boolean;
  canDiscount: boolean;
  discount: string;
  type: OrderType.DINE_IN | OrderType.TAKEAWAY;
  notes: string;
  setNotes: (value: string) => void;
  setDiscount: (value: string) => void;
  setType: (value: OrderType.DINE_IN | OrderType.TAKEAWAY) => void;
  changeQuantity: (index: number, delta: number) => void;
  selectedTable?: TableItemView | null;
  guestCount?: number;
  activeTabOrderId?: string | null;
  onOpenTablePicker?: () => void;
  onClearTable?: () => void;
  onGuestCountChange?: (count: number) => void;
}

export function CartTypeSelector({
  type,
  setType,
  locked,
  selectedTable,
  guestCount = 2,
  activeTabOrderId,
  onOpenTablePicker,
  onClearTable,
  onGuestCountChange,
}: {
  type: OrderType.DINE_IN | OrderType.TAKEAWAY;
  setType: (type: OrderType.DINE_IN | OrderType.TAKEAWAY) => void;
  locked: boolean;
  selectedTable?: TableItemView | null;
  guestCount?: number;
  activeTabOrderId?: string | null;
  onOpenTablePicker?: () => void;
  onClearTable?: () => void;
  onGuestCountChange?: (count: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl">
        {([OrderType.TAKEAWAY, OrderType.DINE_IN] as const).map((t) => (
          <button
            key={t}
            disabled={locked}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
              type === t
                ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            {t === OrderType.TAKEAWAY ? 'سفري' : 'صالة'}
          </button>
        ))}
      </div>

      {/* Dine-In Table Picker Section */}
      {type === OrderType.DINE_IN && (
        <div className="animate-in fade-in">
          {activeTabOrderId ? (
            <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/70 p-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="grid size-6 place-items-center rounded-lg bg-indigo-900 text-white font-bold text-[11px]">
                  {selectedTable?.tableNumber || '#'}
                </div>
                <div>
                  <p className="font-bold text-indigo-950">إضافة طلبات لطاولة {selectedTable?.tableNumber}</p>
                  <p className="text-[10px] text-indigo-700">طلب مفتوح جاري</p>
                </div>
              </div>
            </div>
          ) : selectedTable ? (
            <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-zinc-900 text-white font-bold text-xs">
                  {selectedTable.tableNumber}
                </div>
                <div className="truncate">
                  <p className="font-bold text-zinc-900 truncate">طاولة {selectedTable.tableNumber}</p>
                  <p className="text-[10px] text-zinc-500 truncate">
                    {selectedTable.sectionNameAr || 'صالة عامة'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Guest Count Stepper */}
                <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-1.5 py-0.5">
                  <button
                    type="button"
                    onClick={() => onGuestCountChange?.(Math.max(1, guestCount - 1))}
                    className="size-4 text-zinc-500 hover:text-zinc-900 font-bold text-[11px]"
                  >
                    -
                  </button>
                  <span className="text-[11px] font-bold text-zinc-800 min-w-4 text-center">
                    {guestCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => onGuestCountChange?.(Math.min(20, guestCount + 1))}
                    className="size-4 text-zinc-500 hover:text-zinc-900 font-bold text-[11px]"
                  >
                    +
                  </button>
                  <Users className="size-3 text-zinc-400" />
                </div>

                <button
                  type="button"
                  onClick={onOpenTablePicker}
                  className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-200/60"
                >
                  تغيير
                </button>

                <button
                  type="button"
                  onClick={onClearTable}
                  className="grid size-5 place-items-center rounded-md text-zinc-400 hover:text-rose-600"
                  title="إلغاء تحديد الطاولة"
                >
                  <X className="size-3" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={locked}
              onClick={onOpenTablePicker}
              className="flex w-full items-center justify-between rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 px-2.5 py-2 text-xs font-semibold text-zinc-700 hover:border-zinc-400 hover:bg-zinc-100 active:scale-[0.99] transition"
            >
              <div className="flex items-center gap-2">
                <Armchair className="size-4 text-zinc-500" strokeWidth={1.8} />
                <span>اختر الطاولة من الصالة...</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">تحديد ▾</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function CartLines({
  items,
  products,
  settings,
  locked,
  changeQuantity,
}: Pick<PosCartProps, 'items' | 'products' | 'settings' | 'locked' | 'changeQuantity'>) {
  if (!items.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center py-10 text-center text-zinc-400">
        <ShoppingCart size={28} strokeWidth={1.5} className="mb-2 text-zinc-300" />
        <p className="text-xs font-semibold text-zinc-600">سلة الطلب فارغة</p>
        <span className="text-[11px] text-zinc-400 mt-0.5">اضغط على أي صنف لإضافته للطلب</span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 py-0.5">
      {items.map((item, index) => {
        const product = products.find((candidate) => candidate.id === item.productId)!;
        const size = product.sizes.find((candidate) => candidate.id === item.sizeId)!;
        const modifiers = product.modifierGroups
          .flatMap((group) => group.modifiers)
          .filter((modifier) => item.modifierIds.includes(modifier.id));
        const price = modifiers.reduce(
          (sum, modifier) => sum.add(Money.fromMinor(modifier.priceDelta, settings.currency)),
          Money.fromMinor(size.price, settings.currency)
        );

        return (
          <div
            key={index}
            className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200/80 bg-white p-2 shadow-2xs transition-colors hover:border-zinc-300"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-1">
                <p className="truncate text-xs font-bold text-zinc-900">{product.nameAr}</p>
                <p className="font-mono text-xs font-bold text-zinc-950 shrink-0">
                  {price.multiply(item.quantity).format(settings.locale)}
                </p>
              </div>
              {(size.nameAr || modifiers.length > 0) && (
                <p className="truncate text-[10px] text-zinc-500 mt-0.5">
                  {size.nameAr}
                  {modifiers.map((m) => ` + ${m.nameAr}`)}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0 border-s border-zinc-100 ps-1.5">
              <button
                type="button"
                disabled={locked}
                aria-label={'تقليل ' + product.nameAr}
                onClick={() => changeQuantity(index, -1)}
                className="grid size-6 place-items-center rounded-md border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 active:scale-95 disabled:opacity-40 transition"
              >
                <Minus size={12} />
              </button>
              <span className="w-4 text-center font-mono text-xs font-bold text-zinc-900">
                {item.quantity}
              </span>
              <button
                type="button"
                disabled={locked || item.quantity >= 99}
                aria-label={'زيادة ' + product.nameAr}
                onClick={() => changeQuantity(index, 1)}
                className="grid size-6 place-items-center rounded-md border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 active:scale-95 disabled:opacity-40 transition"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CartOptions({
  canDiscount,
  discount,
  setDiscount,
  notes,
  setNotes,
  settings,
  locked,
}: Pick<
  PosCartProps,
  'canDiscount' | 'discount' | 'setDiscount' | 'notes' | 'setNotes' | 'settings' | 'locked'
>) {
  const [showNotes, setShowNotes] = useState(Boolean(notes));
  const [showDiscount, setShowDiscount] = useState(Boolean(discount && discount !== '0'));

  return (
    <div className="text-xs space-y-1">
      <div className="flex items-center gap-2">
        {!showNotes ? (
          <button
            type="button"
            disabled={locked}
            onClick={() => setShowNotes(true)}
            className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 transition py-0.5 px-1.5 rounded hover:bg-zinc-100"
          >
            + ملاحظة
          </button>
        ) : (
          <div className="relative flex-1">
            <input
              disabled={locked}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              placeholder="ملاحظات الطلب..."
              className="w-full h-7 rounded-lg border border-zinc-200 bg-white px-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
            {notes === '' && (
              <button
                type="button"
                onClick={() => setShowNotes(false)}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-[10px]"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {canDiscount && (
          !showDiscount ? (
            <button
              type="button"
              disabled={locked}
              onClick={() => setShowDiscount(true)}
              className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 transition py-0.5 px-1.5 rounded hover:bg-zinc-100 mr-auto"
            >
              % خصم
            </button>
          ) : (
            <div className="relative w-28">
              <input
                disabled={locked}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                inputMode="decimal"
                placeholder={`خصم (${settings.currency})`}
                className="w-full h-7 rounded-lg border border-zinc-200 bg-white px-2 text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              {(discount === '' || discount === '0') && (
                <button
                  type="button"
                  onClick={() => setShowDiscount(false)}
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-[10px]"
                >
                  ✕
                </button>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export function CartTotals({
  totals,
  settings,
}: Pick<PosCartProps, 'totals' | 'settings'>) {
  const money = (value: number) =>
    Money.fromMinor(value, settings.currency).format(settings.locale);

  return (
    <div className="space-y-1 text-xs border-t border-zinc-100 pt-2">
      <div className="flex justify-between text-zinc-500 text-[11px]">
        <span>
          المجموع: {money(totals?.subtotalMinor ?? 0)} · الضريبة ({settings.taxRatePercent}%): {money(totals?.taxMinor ?? 0)}
        </span>
        {(totals?.discountMinor ?? 0) > 0 && (
          <span className="font-semibold text-emerald-700">
            خصم: -{money(totals?.discountMinor ?? 0)}
          </span>
        )}
      </div>
      <div className="flex justify-between items-baseline pt-0.5">
        <span className="text-xs font-bold text-zinc-700">المستحق للدفع:</span>
        <span className="text-lg font-black font-mono text-zinc-950">
          {money(totals?.totalMinor ?? 0)}
        </span>
      </div>
    </div>
  );
}

export function PosCart(props: PosCartProps) {
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="space-y-2 shrink-0">
        <h2 className="flex items-center gap-2 font-bold text-sm text-zinc-900">
          <ShoppingCart size={17} strokeWidth={1.75} />
          الطلب الحالي
        </h2>
        <CartTypeSelector
          type={props.type}
          setType={props.setType}
          locked={props.locked}
          selectedTable={props.selectedTable}
          guestCount={props.guestCount}
          activeTabOrderId={props.activeTabOrderId}
          onOpenTablePicker={props.onOpenTablePicker}
          onClearTable={props.onClearTable}
          onGuestCountChange={props.onGuestCountChange}
        />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto my-2">
        <CartLines {...props} />
      </div>
      <div className="space-y-2 shrink-0 border-t border-zinc-200 pt-2">
        <CartOptions {...props} />
        <CartTotals totals={props.totals} settings={props.settings} />
      </div>
    </div>
  );
}
