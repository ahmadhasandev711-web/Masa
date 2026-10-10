'use client';

import React from 'react';
import { X, Check, Copy, Printer } from 'lucide-react';
import { TableItemView } from '../../../../../application/tables/use-cases/list-tables.use-case';

interface TableQrModalProps {
  table: TableItemView | null;
  onClose: () => void;
  restaurantNameAr: string;
  getTableMenuUrl: (table: TableItemView) => string;
  onCopyLink: (table: TableItemView) => void;
  copiedLink: boolean;
}

export function TableQrModal({
  table,
  onClose,
  restaurantNameAr,
  getTableMenuUrl,
  onCopyLink,
  copiedLink,
}: TableQrModalProps) {
  if (!table) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl animate-in zoom-in-95 text-center">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <h3 className="text-sm font-bold text-zinc-900">
            بطاقة طاولة رقم {table.tableNumber}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Printable Standee Card */}
        <div id="printable-table-card" className="mt-4 rounded-2xl border-2 border-zinc-900 bg-white p-5 shadow-sm space-y-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
              {restaurantNameAr}
            </span>
            <h4 className="text-lg font-black text-zinc-900">
              طاولة {table.tableNumber}
            </h4>
            {table.sectionNameAr && (
              <p className="text-xs text-zinc-600">{table.sectionNameAr}</p>
            )}
          </div>

          {/* QR Code Container */}
          <div className="mx-auto grid size-44 place-items-center rounded-xl border border-zinc-200 bg-zinc-50/50 p-2">
            {/* Responsive crisp QR image from lightweight public endpoint */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                getTableMenuUrl(table)
              )}`}
              alt={`QR للطاولة ${table.tableNumber}`}
              className="size-36 rounded-md mix-blend-multiply"
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-zinc-800">امسح الرمز للاطلاع على المنيو والطلب</p>
            <p className="font-mono text-[10px] text-zinc-400 truncate max-w-xs mx-auto">
              {getTableMenuUrl(table)}
            </p>
          </div>
        </div>

        {/* QR Actions */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => onCopyLink(table)}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            {copiedLink ? (
              <>
                <Check className="size-3.5 text-emerald-600" />
                <span>تم النسخ!</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                <span>نسخ الرابط</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 font-semibold text-white shadow-xs hover:bg-zinc-800"
          >
            <Printer className="size-3.5" />
            <span>طباعة البطاقة</span>
          </button>
        </div>
      </div>
    </div>
  );
}
