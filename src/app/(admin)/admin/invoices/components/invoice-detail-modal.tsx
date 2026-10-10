'use client';

import React from 'react';
import {
  Receipt,
  Printer,
  ChefHat,
  X,
  Banknote,
  CreditCard,
} from 'lucide-react';
import { InvoiceOrderRecord } from '../invoices-client';

interface InvoiceDetailModalProps {
  selectedInvoice: InvoiceOrderRecord | null;
  onClose: () => void;
  onPrintThermal: (order: InvoiceOrderRecord) => void;
  onPrintKot: (order: InvoiceOrderRecord) => void;
  formatMoney: (minor: number) => string;
}

export function InvoiceDetailModal({
  selectedInvoice,
  onClose,
  onPrintThermal,
  onPrintKot,
  formatMoney,
}: InvoiceDetailModalProps) {
  if (!selectedInvoice) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-zinc-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-zinc-900 text-white shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-zinc-900">
                  فاتورة #{selectedInvoice.orderNumber}
                </h3>
                {selectedInvoice.paymentStatus === 'PAID' ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    مسددة بالكامل
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                    شيك مفتوح / معلق
                  </span>
                )}
              </div>
              <span className="text-xs text-zinc-500 font-mono">
                {new Date(selectedInvoice.createdAt).toLocaleString('ar-EG', {
                  dateStyle: 'full',
                  timeStyle: 'medium',
                })}
              </span>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPrintThermal(selectedInvoice)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 transition shadow-2xs cursor-pointer"
              title="طباعة إيصال الفاتورة الحراري"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة فاتورة</span>
            </button>
            <button
              type="button"
              onClick={() => onPrintKot(selectedInvoice)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 transition shadow-2xs cursor-pointer"
              title="طباعة بون المطبخ"
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>بون المطبخ</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable Audit Details */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-zinc-50 border border-zinc-100 text-xs">
            <div>
              <span className="text-zinc-400 block text-[11px]">الفرع</span>
              <span className="font-bold text-zinc-800 mt-0.5 block">
                {selectedInvoice.branch?.nameAr || 'الفرع الرئيسي'}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[11px]">الكاشير المسؤول</span>
              <span className="font-bold text-zinc-800 mt-0.5 block">
                {selectedInvoice.cashier?.fullName || 'الموقع العام'}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[11px]">نوع الطلب والقناة</span>
              <span className="font-bold text-zinc-800 mt-0.5 block">
                {selectedInvoice.type === 'DINE_IN'
                  ? `صالة (${selectedInvoice.tableName || 'طاولة'})`
                  : selectedInvoice.type === 'TAKEAWAY'
                  ? 'سفري'
                  : 'توصيل'}
                {' • '}
                {selectedInvoice.source === 'POS' ? 'كاشير' : 'الموقع'}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[11px]">طريقة السداد</span>
              <span className="font-bold text-zinc-800 mt-0.5 block">
                {selectedInvoice.paymentMethod === 'CASH'
                  ? 'نقدي'
                  : selectedInvoice.paymentMethod === 'CARD'
                  ? 'بطاقة دفع'
                  : selectedInvoice.paymentMethod === 'MIXED'
                  ? 'دفع مختلط'
                  : selectedInvoice.paymentMethod}
              </span>
            </div>
          </div>

          {/* Items Breakdown Table */}
          <div>
            <h4 className="text-xs font-bold text-zinc-900 mb-2.5">تفاصيل الأصناف والكميات</h4>
            <div className="border border-zinc-200 rounded-xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-zinc-50 text-zinc-500 font-bold border-b border-zinc-200">
                  <tr>
                    <th className="py-2.5 px-3">الصنف والمقاس</th>
                    <th className="py-2.5 px-3 text-center">الكمية</th>
                    <th className="py-2.5 px-3 text-left">سعر الوحدة</th>
                    <th className="py-2.5 px-3 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {selectedInvoice.items.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/50">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-zinc-900">{item.productNameAr}</span>
                        {item.sizeNameAr && (
                          <span className="text-zinc-400 mr-1.5">({item.sizeNameAr})</span>
                        )}
                        {item.modifiers.length > 0 && (
                          <div className="text-[11px] text-zinc-500 mt-0.5 space-y-0.5">
                            {item.modifiers.map((m) => (
                              <div key={m.id}>
                                + {m.nameAr}{' '}
                                {m.priceDeltaMinor > 0 && `(${formatMoney(m.priceDeltaMinor)})`}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold font-mono">
                        {item.quantity}×
                      </td>
                      <td className="py-2.5 px-3 text-left font-mono text-zinc-600">
                        {formatMoney(item.unitPriceMinor)}
                      </td>
                      <td className="py-2.5 px-3 text-left font-bold font-mono text-zinc-900">
                        {formatMoney(item.totalPriceMinor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payments & Financial Totals Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Payments Log */}
            <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-2">
              <span className="text-xs font-bold text-zinc-900 block">سجل الدفعات المحصلة</span>
              {selectedInvoice.payments && selectedInvoice.payments.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedInvoice.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-zinc-200"
                    >
                      <div className="flex items-center gap-1.5">
                        {p.method === 'CASH' ? (
                          <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                        )}
                        <span className="font-medium text-zinc-800">
                          {p.method === 'CASH' ? 'نقدي' : 'بطاقة'}
                        </span>
                      </div>
                      <span className="font-bold font-mono text-zinc-900">
                        {formatMoney(p.amountMinor)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 italic">
                  {selectedInvoice.paymentStatus === 'PAID'
                    ? 'تم التحصيل بالكامل عند إغلاق الفاتورة'
                    : 'لم يتم تسجيل دفعات بعد (شيك مفتوح)'}
                </p>
              )}
            </div>

            {/* Financial Summary */}
            <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50 space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>المجموع الفرعي:</span>
                <span className="font-mono">{formatMoney(selectedInvoice.subtotalMinor)}</span>
              </div>
              {selectedInvoice.deliveryFeeMinor > 0 && (
                <div className="flex justify-between text-zinc-600">
                  <span>رسوم التوصيل:</span>
                  <span className="font-mono">{formatMoney(selectedInvoice.deliveryFeeMinor)}</span>
                </div>
              )}
              {selectedInvoice.taxMinor > 0 && (
                <div className="flex justify-between text-zinc-600">
                  <span>ضريبة القيمة المضافة:</span>
                  <span className="font-mono">{formatMoney(selectedInvoice.taxMinor)}</span>
                </div>
              )}
              {selectedInvoice.discountMinor > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>الخصم المطبق:</span>
                  <span className="font-mono">-{formatMoney(selectedInvoice.discountMinor)}</span>
                </div>
              )}
              <div className="border-t border-zinc-200 pt-2 mt-2 flex justify-between font-black text-sm text-zinc-900">
                <span>الإجمالي النهائي:</span>
                <span className="font-mono text-base text-emerald-600">
                  {formatMoney(selectedInvoice.totalMinor)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-zinc-50 border-t border-zinc-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
