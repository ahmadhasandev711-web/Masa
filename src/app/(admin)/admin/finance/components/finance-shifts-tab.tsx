'use client';

import React from 'react';
import { Clock, AlertTriangle, DollarSign, Wallet, Eye, Lock, CheckCircle2 } from 'lucide-react';
import { FinancePageData } from '../finance.types';
import { CashShiftStatus } from '../../../../../domain/finance/enums';

interface FinanceShiftsTabProps {
  shifts: FinancePageData['shifts'];
  filteredShifts: FinancePageData['shifts'];
  openShiftsCount: number;
  pendingAuditCount: number;
  shiftStatusFilter: 'ALL' | CashShiftStatus;
  onStatusFilterChange: (status: 'ALL' | CashShiftStatus) => void;
  formatMoney: (minor: number) => string;
  onOpenDetails: (shiftId: string) => void;
  onOpenBlindClose: (shiftId: string) => void;
  onOpenAudit: (shiftId: string) => void;
}

export function FinanceShiftsTab({
  shifts,
  filteredShifts,
  openShiftsCount,
  pendingAuditCount,
  shiftStatusFilter,
  onStatusFilterChange,
  formatMoney,
  onOpenDetails,
  onOpenBlindClose,
  onOpenAudit,
}: FinanceShiftsTabProps) {
  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">الورديات المفتوحة حالياً</span>
            <Clock className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900">{openShiftsCount}</p>
          <p className="mt-1 text-[11px] text-zinc-500">جلسات كاشير نشطة تتلقى مبيعات</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">بانتظار تدقيق الإدارة</span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900">{pendingAuditCount}</p>
          <p className="mt-1 text-[11px] text-zinc-500">ورديات مغلقة تتطلب اعتماد الفروقات</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">إجمالي مبيعات اليوم (المحصلة)</span>
            <DollarSign className="h-4 w-4 text-zinc-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900">
            {formatMoney(shifts.reduce((acc, s) => acc + s.totalSalesMinor, 0))}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">من كافة ورديات الفرع المحملة</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">صافي الفروقات (عجز / زيادة)</span>
            <Wallet className="h-4 w-4 text-zinc-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900">
            {formatMoney(shifts.reduce((acc, s) => acc + (s.varianceMinor ?? 0), 0))}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">إجمالي الفارق الدفتري التراكمي</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500">تصفية الحالة:</span>
          <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-1 text-xs">
            {(['ALL', CashShiftStatus.OPEN, CashShiftStatus.CLOSED, CashShiftStatus.AUDITED] as const).map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => onStatusFilterChange(st)}
                  className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                    shiftStatusFilter === st
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {st === 'ALL'
                    ? 'الكل'
                    : st === CashShiftStatus.OPEN
                    ? 'مفتوحة'
                    : st === CashShiftStatus.CLOSED
                    ? 'مغلقة'
                    : 'معتمدة'}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Shifts Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-4 py-3 font-semibold">الكاشير</th>
                <th className="px-4 py-3 font-semibold">وقت الفتح</th>
                <th className="px-4 py-3 font-semibold">رصيد الافتتاح</th>
                <th className="px-4 py-3 font-semibold">مبيعات نقدية</th>
                <th className="px-4 py-3 font-semibold">مبيعات شبكة</th>
                <th className="px-4 py-3 font-semibold">المتوقع دفترياً</th>
                <th className="px-4 py-3 font-semibold">الفعلي المعدود</th>
                <th className="px-4 py-3 font-semibold">الفارق</th>
                <th className="px-4 py-3 font-semibold">الحالة</th>
                <th className="px-4 py-3 font-semibold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredShifts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-zinc-400">
                    لا توجد ورديات تطابق الفلتر المحدد
                  </td>
                </tr>
              ) : (
                filteredShifts.map((shift) => {
                  const isShortage = (shift.varianceMinor ?? 0) < 0;
                  const isBalanced = shift.varianceMinor === 0;

                  return (
                    <tr key={shift.id} className="hover:bg-zinc-50/75 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-zinc-900">
                        {shift.cashierName}
                      </td>
                      <td className="px-4 py-3.5 text-zinc-600">
                        {new Date(shift.openedAt).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        <div className="text-[11px] text-zinc-400">
                          {new Date(shift.openedAt).toLocaleDateString('ar-EG')}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-zinc-800">
                        {formatMoney(shift.openingCashMinor)}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-emerald-700">
                        {formatMoney(shift.cashSalesMinor)}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-indigo-700">
                        {formatMoney(shift.cardSalesMinor)}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-zinc-700">
                        {shift.expectedCashMinor !== null
                          ? formatMoney(shift.expectedCashMinor)
                          : '—'}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-medium text-zinc-900">
                        {shift.closingCashMinor !== null
                          ? formatMoney(shift.closingCashMinor)
                          : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        {shift.varianceMinor === null ? (
                          <span className="text-zinc-400">—</span>
                        ) : isBalanced ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            مطابق
                          </span>
                        ) : isShortage ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
                            عجز ({formatMoney(Math.abs(shift.varianceMinor))})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700 border border-sky-200">
                            زيادة (+{formatMoney(shift.varianceMinor)})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {shift.status === CashShiftStatus.OPEN && (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                            مفتوحة
                          </span>
                        )}
                        {shift.status === CashShiftStatus.CLOSED && (
                          <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                            مغلقة
                          </span>
                        )}
                        {shift.status === CashShiftStatus.AUDITED && (
                          <span className="inline-flex rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-semibold text-zinc-800">
                            معتمدة
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Details */}
                          <button
                            type="button"
                            onClick={() => onOpenDetails(shift.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                            title="عرض التفاصيل الكاملة"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>تفاصيل</span>
                          </button>

                          {/* Blind Close button if OPEN */}
                          {shift.status === CashShiftStatus.OPEN && (
                            <button
                              type="button"
                              onClick={() => onOpenBlindClose(shift.id)}
                              className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-700"
                              title="إغلاق أعمى للوردية"
                            >
                              <Lock className="h-3.5 w-3.5" />
                              <span>إغلاق</span>
                            </button>
                          )}

                          {/* Audit button if CLOSED */}
                          {shift.status === CashShiftStatus.CLOSED && (
                            <button
                              type="button"
                              onClick={() => onOpenAudit(shift.id)}
                              className="inline-flex items-center gap-1 rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-800"
                              title="اعتماد وتدقيق الفروقات"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                              <span>اعتماد</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
