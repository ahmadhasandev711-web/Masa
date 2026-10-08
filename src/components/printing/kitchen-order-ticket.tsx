'use client';

import React from 'react';

export interface KitchenTicketItem {
  id?: string;
  productNameAr: string;
  productNameEn?: string;
  sizeNameAr?: string | null;
  sizeNameEn?: string | null;
  quantity: number;
  modifiers?: Array<{
    nameAr: string;
    nameEn?: string;
  }>;
  notes?: string | null;
}

export interface KitchenTicketData {
  orderNumber: string;
  type: string; // DINE_IN | TAKEAWAY | DELIVERY
  tableName?: string | null;
  sectionName?: string | null;
  guestCount?: number | null;
  customerName?: string | null;
  customerNotes?: string | null;
  kitchenNotes?: string | null;
  createdAt: Date | string;
  branchName?: string | null;
  cashierName?: string | null;
  items: KitchenTicketItem[];
}

export interface KitchenOrderTicketProps {
  ticket: KitchenTicketData | null;
  restaurantName?: string;
}

export function KitchenOrderTicketPrint({
  ticket,
  restaurantName = 'قهوة كايرو',
}: KitchenOrderTicketProps) {
  if (!ticket) return null;

  const formattedDate = new Date(ticket.createdAt).toLocaleString('ar-EG', {
    dateStyle: 'short',
    timeStyle: 'medium',
  });

  const getOrderTypeLabel = () => {
    switch (ticket.type) {
      case 'DINE_IN':
        return `صالة — طاولة ${ticket.tableName || 'غير محددة'}`;
      case 'TAKEAWAY':
        return 'سفري (تيك أواي)';
      case 'DELIVERY':
        return 'توصيل (دليفري)';
      default:
        return ticket.type;
    }
  };

  return (
    <section
      id="printable-kitchen-ticket"
      className="printable-document hidden bg-white text-black print:block print:w-[76mm] print:mx-auto print:p-2 print:font-mono text-xs leading-tight"
      dir="rtl"
    >
      {/* Header */}
      <header className="border-b-2 border-dashed border-black pb-2 text-center">
        <h1 className="text-base font-extrabold">{restaurantName}</h1>
        {ticket.branchName && (
          <p className="text-[11px] font-bold mt-0.5">فرع: {ticket.branchName}</p>
        )}
        <div className="mt-1.5 border-2 border-black py-1 px-2 rounded">
          <p className="text-sm font-black tracking-wide">*** بون تشغيل مطبخ ***</p>
          <p className="text-xs font-extrabold mt-0.5">{getOrderTypeLabel()}</p>
          {ticket.sectionName && (
            <p className="text-[10px] text-zinc-700">قسم: {ticket.sectionName}</p>
          )}
          {ticket.guestCount && ticket.guestCount > 0 && (
            <p className="text-[10px] text-zinc-700">عدد الضيوف: {ticket.guestCount}</p>
          )}
        </div>
      </header>

      {/* Meta Information */}
      <div className="border-b border-dashed border-black py-2 space-y-1 text-[11px]">
        <div className="flex justify-between items-center py-1 border-b border-dashed border-zinc-400">
          <span className="font-black text-sm">رقم الطلب:</span>
          <span className="text-2xl font-black font-mono tracking-wider" dir="ltr">
            #{ticket.orderNumber}
          </span>
        </div>
        <div className="flex justify-between pt-1">
          <span>وقت الاستلام:</span>
          <span>{formattedDate}</span>
        </div>
        {ticket.customerName && (
          <div className="flex justify-between">
            <span>العميل:</span>
            <span className="font-bold">{ticket.customerName}</span>
          </div>
        )}
        {ticket.cashierName && (
          <div className="flex justify-between">
            <span>الموظف:</span>
            <span>{ticket.cashierName}</span>
          </div>
        )}
      </div>

      {/* Items Section */}
      <div className="py-2 border-b-2 border-black">
        <div className="flex justify-between font-extrabold text-[11px] border-b border-black pb-1 mb-1.5">
          <span>الصنف والمقاس</span>
          <span>الكمية</span>
        </div>

        <div className="space-y-2.5">
          {ticket.items.map((item, index) => (
            <div key={item.id || index} className="text-xs">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <span className="font-black text-sm text-black">
                    {item.productNameAr}
                  </span>
                  {item.sizeNameAr && (
                    <span className="text-[11px] font-bold text-zinc-800">
                      {' '}({item.sizeNameAr})
                    </span>
                  )}
                </div>
                <span className="font-black text-sm px-1.5 py-0.5 border border-black rounded shrink-0">
                  {item.quantity}×
                </span>
              </div>

              {/* Modifiers */}
              {item.modifiers && item.modifiers.length > 0 && (
                <div className="mr-3 mt-0.5 space-y-0.5 text-[11px] font-bold text-zinc-800">
                  {item.modifiers.map((m, mIdx) => (
                    <p key={mIdx}>+ {m.nameAr}</p>
                  ))}
                </div>
              )}

              {/* Item Specific Notes */}
              {item.notes && (
                <div className="mr-2 mt-1 p-1 border border-zinc-500 bg-zinc-100 rounded text-[10px] font-bold">
                  *** ملاحظة: {item.notes} ***
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Global Notes */}
      {(ticket.customerNotes || ticket.kitchenNotes) && (
        <div className="border-b border-dashed border-black py-2 space-y-1 text-[11px]">
          {ticket.customerNotes && (
            <div className="p-1.5 border border-black rounded bg-zinc-50 font-bold">
              <span>ملاحظات العميل: </span>
              <span>{ticket.customerNotes}</span>
            </div>
          )}
          {ticket.kitchenNotes && (
            <div className="p-1.5 border border-black rounded bg-zinc-50 font-bold">
              <span>ملاحظات المطبخ: </span>
              <span>{ticket.kitchenNotes}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="pt-2 text-center text-[10px] space-y-0.5 font-bold">
        <p>*** نهاية تذكرة المطبخ ***</p>
        <p className="text-[9px] text-zinc-600 font-sans">Qahwet Cairo Order Ticket (Barista / Kitchen)</p>
      </footer>
    </section>
  );
}
