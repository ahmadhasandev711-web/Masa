'use client';

import React from 'react';
import { Receipt, Calendar } from 'lucide-react';
import { FinancePageData } from '../finance.types';

interface FinanceProfitabilityTabProps {
  report: FinancePageData['report'];
  formatMoney: (minor: number) => string;
}

export function FinanceProfitabilityTab({
  report,
  formatMoney,
}: FinanceProfitabilityTabProps) {
  return (
    <div className="space-y-6">
      {/* Executive P&L Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-zinc-500">صافي المبيعات (Revenue)</span>
          <p className="mt-2 text-2xl font-bold text-zinc-900">
            {formatMoney(report.netSalesMinor)}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">
            {report.totalOrdersCount} طلب مكتمل ومسلّم
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">تكلفة البضاعة المباعة (COGS)</span>
            <span className="text-[11px] font-semibold text-rose-600">
              {report.cogsPercent}%
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-700">
            {formatMoney(report.cogsMinor)}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">من استهلاك وصفات الـ BOM والمخزون</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-zinc-500">المصروفات التشغيلية الميدانية</span>
          <p className="mt-2 text-2xl font-bold text-amber-700">
            {formatMoney(report.operatingExpensesMinor)}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">نثريات وصيانة ومرافق</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">مجمل الربح التشغيلي</span>
            <span className="text-[11px] font-semibold text-emerald-600">
              {report.grossMarginPercent}%
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {formatMoney(report.grossProfitMinor)}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">(المبيعات - تكلفة البضاعة)</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">صافي هامش التشغيل</span>
            <span className="text-[11px] font-semibold text-zinc-800">
              {report.operatingMarginPercent}%
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900">
            {formatMoney(report.operatingProfitMinor)}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">بعد خصم المصروفات</p>
        </div>
      </div>

      {/* Breakdown Section: Categories vs Daily */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Expenses by Category */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <h2 className="text-base font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-zinc-600" />
            <span>توزيع المصروفات حسب التبويب</span>
          </h2>
          {report.expensesByCategory.length === 0 ? (
            <p className="py-6 text-center text-xs text-zinc-400">لا توجد مصروفات مسجلة في هذه الفترة</p>
          ) : (
            <div className="space-y-3">
              {report.expensesByCategory.map((c) => (
                <div key={c.categoryNameAr} className="space-y-1">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-medium text-zinc-800">{c.categoryNameAr}</span>
                    <span className="font-mono text-zinc-600">
                      {formatMoney(c.totalMinor)} ({c.percent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-zinc-800 transition-all"
                      style={{ width: `${Math.min(c.percent, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Daily Breakdown */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <h2 className="text-base font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-zinc-600" />
            <span>سجل الأداء المالي اليومي</span>
          </h2>
          {report.dailyBreakdown.length === 0 ? (
            <p className="py-6 text-center text-xs text-zinc-400">لا توجد حركات مالية مسجلة لهذه الفترة</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">التاريخ</th>
                    <th className="px-3 py-2 font-semibold">المبيعات</th>
                    <th className="px-3 py-2 font-semibold">التكلفة (COGS)</th>
                    <th className="px-3 py-2 font-semibold">المصروفات</th>
                    <th className="px-3 py-2 font-semibold">الربح الصافي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {report.dailyBreakdown.map((d) => (
                    <tr key={d.date} className="hover:bg-zinc-50">
                      <td className="px-3 py-2 font-mono text-zinc-700">{d.date}</td>
                      <td className="px-3 py-2 font-mono text-zinc-900 font-medium">
                        {formatMoney(d.salesMinor)}
                      </td>
                      <td className="px-3 py-2 font-mono text-rose-700">
                        {formatMoney(d.cogsMinor)}
                      </td>
                      <td className="px-3 py-2 font-mono text-amber-700">
                        {formatMoney(d.expensesMinor)}
                      </td>
                      <td className="px-3 py-2 font-mono font-bold text-emerald-700">
                        {formatMoney(d.grossProfitMinor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
