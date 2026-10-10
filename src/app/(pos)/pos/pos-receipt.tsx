'use client';

import { PosReceipt } from '../../../domain/pos/contracts/pos.repository';
import { Money } from '../../../domain/shared/value-objects/money';
import { OrderType, PaymentMethod } from '../../../domain/ordering/enums';
import { KitchenTicketData } from '../../../components/printing/kitchen-order-ticket';

export function PosReceiptPrint({ receipt, restaurantName }: { receipt: PosReceipt | null; restaurantName: string }) {
  if (!receipt) return null;
  const format = (minor: number) => Money.fromMinor(minor, receipt.currency).format(receipt.locale);
  return (
    <section
      id="printable-pos-receipt"
      className="printable-document hidden bg-white text-black print:block print:w-[72mm] print:max-w-[72mm] print:p-1.5 box-border overflow-hidden"
      dir="rtl"
    >
      <header className="border-b border-dashed border-black pb-2 text-center">
        <h1 className="text-base font-bold">{restaurantName}</h1>
        <p className="text-xs">{receipt.branchName} — {receipt.type === OrderType.DINE_IN ? 'صالة' : 'سفري'}</p>
      </header>
      <div className="my-2 py-1.5 border-y border-dashed border-black text-center">
        <p className="text-[10px] font-bold text-zinc-700">رقم الفاتورة</p>
        <p className="text-xl font-black font-mono tracking-wider" dir="ltr">
          #{receipt.orderNumber}
        </p>
      </div>
      <p className="mb-1 text-xs">{new Date(receipt.createdAt).toLocaleString(receipt.locale)}</p>
      {receipt.customerName && <p className="text-xs font-bold">العميل: {receipt.customerName}</p>}
      <div className="my-2 border-t border-dashed border-zinc-400">
        {receipt.items.map((item, index) => (
          <div key={index} className="border-b border-dashed border-zinc-300 py-1.5 text-xs">
            <div className="flex justify-between gap-1">
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
        {receipt.discountMinor > 0 && (
          <div className="flex justify-between"><dt>الخصم</dt><dd>{format(receipt.discountMinor)}</dd></div>
        )}
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
      <p className="mt-3 text-center text-xs font-bold">شكراً لزيارتكم</p>
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
      className="printable-document hidden bg-white text-black print:block print:w-[72mm] print:max-w-[72mm] print:p-1.5 box-border overflow-hidden"
      dir="rtl"
    >
      <header className="border-b border-dashed border-black pb-2 text-center">
        <h1 className="text-base font-bold">{restaurantName || billHeader.restaurantNameAr}</h1>
        <p className="text-xs">{billHeader.branchNameAr} — شيك حساب صالة</p>
        <p className="mt-1 text-sm font-black">طاولة {billHeader.tableNumber}</p>
        <p className="text-[10px] text-zinc-600">عدد الضيوف: {billHeader.guestCount} أفراد</p>
      </header>
      <div className="my-2 py-1.5 border-y border-dashed border-black text-center">
        <p className="text-[10px] font-bold text-zinc-700">شيك طاولة {billHeader.tableNumber}</p>
        <p className="text-xl font-black font-mono tracking-wider" dir="ltr">
          #{billHeader.orderNumber}
        </p>
      </div>
      <p className="mb-1 text-xs">{new Date(billHeader.printedAt).toLocaleString('ar-EG')}</p>
      <p className="text-xs">الكاشير: {billHeader.cashierName}</p>
      <div className="my-2 border-t border-dashed border-zinc-400">
        {items.map((item, index) => (
          <div key={index} className="border-b border-dashed border-zinc-300 py-1.5 text-xs">
            <div className="flex justify-between gap-1">
              <b>{item.nameAr} {item.sizeNameAr ? `(${item.sizeNameAr})` : ''} × {item.quantity}</b>
              <span>{(item.totalPriceMinor / 100).toFixed(2)} {currencySymbol}</span>
            </div>
            {item.modifiers.map((m, mIdx) => (
              <p key={mIdx} className="text-[10px] text-zinc-600">+ {m.nameAr}</p>
            ))}
          </div>
        ))}
      </div>
      <dl className="my-2 space-y-1 text-xs">
        <div className="flex justify-between"><dt>المجموع الفرعي</dt><dd>{(pricing.subtotalMinor / 100).toFixed(2)} {currencySymbol}</dd></div>
        {pricing.taxRatePercent > 0 && (
          <div className="flex justify-between"><dt>الضريبة ({pricing.taxRatePercent}%)</dt><dd>{(pricing.taxMinor / 100).toFixed(2)} {currencySymbol}</dd></div>
        )}
        <div className="flex justify-between border-t border-black pt-1.5 font-bold text-sm"><dt>الإجمالي المستحق</dt><dd>{(pricing.totalMinor / 100).toFixed(2)} {currencySymbol}</dd></div>
      </dl>
      <p className="mt-3 text-center text-[10px] font-bold">هذا شيك استعراض الحساب — يرجى السداد لدى الكاشير</p>
      <p className="mt-1 text-center text-xs">شكراً لزيارتكم</p>
    </section>
  );
}

/**
 * Combined Continuous Thermal Slip (التذكرة المتصلة)
 * Prints Customer Receipt AND Kitchen Order Ticket on a single 72mm roll
 * with a clear tear/cut separator, triggering only ONE browser print command.
 */
export function CombinedPosSlipPrint({
  receipt,
  ticket,
  restaurantName,
}: {
  receipt: PosReceipt | null;
  ticket: KitchenTicketData | null;
  restaurantName: string;
}) {
  if (!receipt) return null;
  const format = (minor: number) => Money.fromMinor(minor, receipt.currency).format(receipt.locale);

  return (
    <div
      id="printable-combined-slip"
      className="printable-document hidden bg-white text-black print:block print:w-[72mm] print:max-w-[72mm] print:p-1.5 box-border overflow-hidden text-xs leading-tight"
      dir="rtl"
    >
      {/* 1. Part One: Customer Receipt */}
      <section>
        <header className="border-b border-dashed border-black pb-2 text-center">
          <h1 className="text-base font-bold">{restaurantName}</h1>
          <p className="text-[11px]">{receipt.branchName} — {receipt.type === OrderType.DINE_IN ? 'صالة' : 'سفري'}</p>
        </header>
        <div className="my-2 py-1 border-y border-dashed border-black text-center">
          <p className="text-[10px] font-bold text-zinc-700">فاتورة العميل</p>
          <p className="text-xl font-black font-mono tracking-wider" dir="ltr">
            #{receipt.orderNumber}
          </p>
        </div>
        <p className="mb-1 text-[11px]">{new Date(receipt.createdAt).toLocaleString(receipt.locale)}</p>
        {receipt.customerName && <p className="text-[11px] font-bold">العميل: {receipt.customerName}</p>}
        <div className="my-2 border-t border-dashed border-zinc-400">
          {receipt.items.map((item, index) => (
            <div key={index} className="border-b border-dashed border-zinc-300 py-1 text-xs">
              <div className="flex justify-between gap-1">
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
          {receipt.discountMinor > 0 && (
            <div className="flex justify-between"><dt>الخصم</dt><dd>{format(receipt.discountMinor)}</dd></div>
          )}
          <div className="flex justify-between border-t border-black pt-1 font-black text-sm">
            <dt>الإجمالي المدفوع</dt>
            <dd>{format(receipt.totalMinor)}</dd>
          </div>
        </dl>
        {receipt.payments.map((payment) => (
          <p key={payment.method} className="flex justify-between text-[11px]">
            <span>{payment.method === PaymentMethod.CASH ? 'نقدي' : 'بطاقة'}</span>
            <span>{format(payment.amountMinor)}</span>
          </p>
        ))}
        {receipt.customerNotes && <p className="mt-1 text-[10px]">ملاحظات: {receipt.customerNotes}</p>}
        <p className="mt-2 text-center text-[10px] font-bold">شكراً لزيارتكم</p>
      </section>

      {/* 2. Tear / Cut Line on Single Roll */}
      <div className="my-3 py-1.5 border-y-2 border-dashed border-black text-center font-bold text-[11px] select-none">
        ✂ ---------------- اقطع الورقة هنا ---------------- ✂
      </div>

      {/* 3. Part Two: Kitchen Order Ticket (KOT) */}
      {ticket && (
        <section className="pt-1 font-mono">
          <header className="border-b-2 border-dashed border-black pb-1 text-center">
            <div className="border-2 border-black py-1 px-1.5 rounded">
              <p className="text-xs font-black tracking-wide">*** بون تشغيل مطبخ ***</p>
              <p className="text-[11px] font-black mt-0.5">
                {ticket.type === 'DINE_IN'
                  ? `صالة — طاولة ${ticket.tableName || 'غير محددة'}`
                  : ticket.type === 'TAKEAWAY'
                  ? 'سفري (تيك أواي)'
                  : 'توصيل (دليفري)'}
              </p>
              {ticket.guestCount && ticket.guestCount > 0 && (
                <p className="text-[10px] text-zinc-700">عدد الضيوف: {ticket.guestCount}</p>
              )}
            </div>
          </header>

          <div className="border-b border-dashed border-black py-1 space-y-0.5 text-[11px]">
            <div className="flex justify-between items-center py-0.5 border-b border-dashed border-zinc-400">
              <span className="font-bold">رقم الطلب:</span>
              <span className="text-lg font-black font-mono tracking-wider" dir="ltr">
                #{ticket.orderNumber}
              </span>
            </div>
            <div className="flex justify-between pt-0.5 text-[10px]">
              <span>الوقت:</span>
              <span>{new Date(ticket.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          <div className="my-2 border-b-2 border-dashed border-black pb-1.5 space-y-1">
            {ticket.items.map((item, index) => (
              <div key={index} className="border-b border-dashed border-zinc-300 pb-1">
                <div className="flex items-center justify-between text-xs font-black">
                  <span>{item.productNameAr} {item.sizeNameAr ? `(${item.sizeNameAr})` : ''}</span>
                  <span className="text-xs font-black bg-black text-white px-1.5 py-0.2 rounded" dir="ltr">
                    × {item.quantity}
                  </span>
                </div>
                {item.modifiers && item.modifiers.length > 0 && (
                  <div className="text-[10px] text-zinc-700 pr-2 mt-0.5">
                    {item.modifiers.map((m, mIdx) => (
                      <span key={mIdx} className="block">+ {m.nameAr}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {ticket.customerNotes && (
            <div className="border border-black p-1 rounded my-1 text-[10px]">
              <span className="font-bold">ملاحظات: </span>
              <span>{ticket.customerNotes}</span>
            </div>
          )}
          <p className="text-center font-bold text-[10px] mt-1.5">*** نهاية بون المطبخ ***</p>
        </section>
      )}
    </div>
  );
}
