'use client';

import { PosReceipt } from '../../../domain/pos/contracts/pos.repository';
import { Money } from '../../../domain/shared/value-objects/money';
import { OrderType, PaymentMethod } from '../../../domain/ordering/enums';

export function PosReceiptPrint({ receipt, restaurantName }: { receipt: PosReceipt | null; restaurantName: string }) {
  if (!receipt) return null;
  const format = (minor: number) => Money.fromMinor(minor, receipt.currency).format(receipt.locale);
  return (
    <section
      id="printable-pos-receipt"
      className="printable-document hidden bg-white text-black print:block print:w-[76mm] print:p-2"
      dir="rtl"
    >
      <header className="border-b border-dashed border-black pb-2 text-center">
        <h1 className="text-lg font-bold">{restaurantName}</h1>
        <p className="text-xs">{receipt.branchName} — {receipt.type === OrderType.DINE_IN ? 'صالة' : 'سفري'}</p>
      </header>
      <div className="my-2 py-1.5 border-y border-dashed border-black text-center">
        <p className="text-[11px] font-bold text-zinc-700">رقم الفاتورة</p>
        <p className="text-2xl font-black font-mono tracking-wider" dir="ltr">
          #{receipt.orderNumber}
        </p>
      </div>
      <p className="mb-2 text-xs">{new Date(receipt.createdAt).toLocaleString(receipt.locale)}</p>
      {receipt.customerName && <p className="text-xs font-bold">العميل: {receipt.customerName}</p>}
      <div className="my-2 border-t border-dashed border-zinc-400">
        {receipt.items.map((item, index) => (
          <div key={index} className="border-b border-dashed border-zinc-300 py-1.5 text-xs">
            <div className="flex justify-between gap-2">
              <b>{item.productNameAr} {item.sizeNameAr ? `(${item.sizeNameAr})` : ''} × {item.quantity}</b>
              <span>{format(item.totalPriceMinor)}</span>
            </div>
            {item.modifiers.map((modifier) => (
              <p key={modifier.modifierId} className="mt-0.5 text-[10px] text-zinc-700">
                + {modifier.nameAr} {format(modifier.priceDeltaMinor)}
              </p>
            ))}
          </div>
        ))}
      </div>
      <dl className="my-2 space-y-1 text-xs">
        <div className="flex justify-between"><dt>المجموع</dt><dd>{format(receipt.subtotalMinor)}</dd></div>
        <div className="flex justify-between"><dt>الضريبة</dt><dd>{format(receipt.taxMinor)}</dd></div>
        <div className="flex justify-between"><dt>الخصم</dt><dd>{format(receipt.discountMinor)}</dd></div>
        <div className="flex justify-between border-t border-black pt-1.5 font-black text-sm">
          <dt>الإجمالي المدفوع</dt>
          <dd>{format(receipt.totalMinor)}</dd>
        </div>
      </dl>
      {receipt.payments.map((payment) => (
        <p key={payment.method} className="flex justify-between text-xs">
          <span>{payment.method === PaymentMethod.CASH ? 'نقدي' : 'بطاقة'}</span>
          <span>{format(payment.amountMinor)}</span>
        </p>
      ))}
      {receipt.customerNotes && <p className="mt-2 text-xs">ملاحظات: {receipt.customerNotes}</p>}
      <p className="mt-4 text-center text-xs font-bold">شكراً لزيارتكم</p>
    </section>
  );
}

export interface TableBillData {
  billHeader: {
    restaurantNameAr: string;
    restaurantNameEn: string;
    branchNameAr: string;
    branchNameEn: string;
    tableNumber: string;
    guestCount: number;
    orderNumber: string;
    cashierName: string;
    printedAt: Date | string;
    currencySymbol: string;
  };
  items: Array<{
    id: string;
    nameAr: string;
    nameEn: string;
    sizeNameAr: string | null;
    quantity: number;
    unitPriceMinor: number;
    totalPriceMinor: number;
    modifiers: Array<{
      nameAr: string;
      priceDeltaMinor: number;
    }>;
  }>;
  pricing: {
    subtotalMinor: number;
    taxRatePercent: number;
    taxMinor: number;
    totalMinor: number;
  };
}

export function TableBillPrint({
  bill,
  restaurantName,
}: {
  bill: TableBillData | null;
  restaurantName: string;
}) {
  if (!bill) return null;
  const { billHeader, items, pricing } = bill;
  const currencySymbol = billHeader.currencySymbol || 'ج.م';
  return (
    <section
      id="printable-table-bill"
      className="printable-document hidden bg-white text-black print:block print:w-[76mm] print:p-2"
      dir="rtl"
    >
      <header className="border-b border-dashed border-black pb-2 text-center">
        <h1 className="text-lg font-bold">{restaurantName || billHeader.restaurantNameAr}</h1>
        <p className="text-xs">{billHeader.branchNameAr} — شيك حساب صالة</p>
        <p className="mt-1 text-sm font-black">طاولة {billHeader.tableNumber}</p>
        <p className="text-[10px] text-zinc-600">عدد الضيوف: {billHeader.guestCount} أفراد</p>
      </header>
      <div className="my-2 py-1.5 border-y border-dashed border-black text-center">
        <p className="text-[11px] font-bold text-zinc-700">شيك طاولة {billHeader.tableNumber}</p>
        <p className="text-xl font-black font-mono tracking-wider" dir="ltr">
          #{billHeader.orderNumber}
        </p>
      </div>
      <p className="mb-2 text-xs">{new Date(billHeader.printedAt).toLocaleString('ar-EG')}</p>
      <p className="text-xs">الكاشير: {billHeader.cashierName}</p>
      <div className="my-2 border-t border-dashed border-zinc-400">
        {items.map((item, index) => (
          <div key={index} className="border-b border-dashed border-zinc-300 py-1.5 text-xs">
            <div className="flex justify-between gap-2">
              <b>{item.nameAr} {item.sizeNameAr ? `(${item.sizeNameAr})` : ''} × {item.quantity}</b>
              <span>{(item.totalPriceMinor / 100).toFixed(2)} {currencySymbol}</span>
            </div>
            {item.modifiers.map((m, mIdx) => (
              <p key={mIdx} className="text-[10px] text-zinc-600">+ {m.nameAr}</p>
            ))}
          </div>
        ))}
      </div>
      <dl className="my-3 space-y-1 text-xs">
        <div className="flex justify-between"><dt>المجموع الفرعي</dt><dd>{(pricing.subtotalMinor / 100).toFixed(2)} {currencySymbol}</dd></div>
        {pricing.taxRatePercent > 0 && (
          <div className="flex justify-between"><dt>الضريبة ({pricing.taxRatePercent}%)</dt><dd>{(pricing.taxMinor / 100).toFixed(2)} {currencySymbol}</dd></div>
        )}
        <div className="flex justify-between border-t border-black pt-1.5 font-bold text-sm"><dt>الإجمالي المستحق</dt><dd>{(pricing.totalMinor / 100).toFixed(2)} {currencySymbol}</dd></div>
      </dl>
      <p className="mt-4 text-center text-[10px] font-bold">هذا شيك استعراض الحساب — يرجى السداد لدى الكاشير</p>
      <p className="mt-1 text-center text-xs">شكراً لزيارتكم</p>
    </section>
  );
}

