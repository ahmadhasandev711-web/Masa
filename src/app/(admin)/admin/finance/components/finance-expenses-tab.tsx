'use client';

import React from 'react';
import { Receipt, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { FinancePageData } from '../finance.types';
import { ExpenseSource } from '../../../../../domain/finance/enums';

interface FinanceExpensesTabProps {
  expenses: FinancePageData['expenses'];
  filteredExpenses: FinancePageData['expenses'];
  expenseSourceFilter: 'ALL' | ExpenseSource;
  onSourceFilterChange: (src: 'ALL' | ExpenseSource) => void;
  formatMoney: (minor: number) => string;
}

export function FinanceExpensesTab({
  expenses,
  filteredExpenses,
  expenseSourceFilter,
  onSourceFilterChange,
  formatMoney,
}: FinanceExpensesTabProps) {
  return (
    <div className="space-y-6">
      {/* KPI Cards for Expenses */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">إجمالي المصروفات</span>
            <Receipt className="h-4 w-4 text-zinc-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900">
            {formatMoney(expenses.reduce((acc, e) => acc + e.amountMinor, 0))}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">كافة السندات المسجلة لهذا الفرع</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">مصروفات من درج الكاشير</span>
            <ArrowDownLeft className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900">
            {formatMoney(
              expenses
                .filter((e) => e.source === ExpenseSource.REGISTER_CASH)
                .reduce((acc, e) => acc + e.amountMinor, 0)
            )}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">خُصمت مباشرة من النقد المتوقع بالأدراج</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">مصروفات من الخزينة / العهدة</span>
            <ArrowUpRight className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900">
            {formatMoney(
              expenses
                .filter((e) => e.source === ExpenseSource.SAFE_PETTY_CASH)
                .reduce((acc, e) => acc + e.amountMinor, 0)
            )}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">من الخزينة الميدانية المستقلة</p>
        </div>
      </div>

      {/* Source Filter */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500">مصدر الصرف:</span>
          <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-1 text-xs">
            {(['ALL', ExpenseSource.REGISTER_CASH, ExpenseSource.SAFE_PETTY_CASH] as const).map(
              (src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => onSourceFilterChange(src)}
                  className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                    expenseSourceFilter === src
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {src === 'ALL'
                    ? 'الكل'
                    : src === ExpenseSource.REGISTER_CASH
                    ? 'درج الكاشير (وردية)'
                    : 'الخزينة المركزية'}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-4 py-3 font-semibold">التاريخ</th>
                <th className="px-4 py-3 font-semibold">التصنيف</th>
                <th className="px-4 py-3 font-semibold">البيان والتفاصيل</th>
                <th className="px-4 py-3 font-semibold">مصدر الصرف</th>
                <th className="px-4 py-3 font-semibold">رقم السند/الفاتورة</th>
                <th className="px-4 py-3 font-semibold">المبلغ</th>
                <th className="px-4 py-3 font-semibold">الموظف القائم بالصرف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">
                    لا توجد مصروفات مسجلة تطابق التصفية
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-zinc-50/75 transition-colors">
                    <td className="px-4 py-3.5 text-zinc-600">
                      {new Date(exp.createdAt).toLocaleDateString('ar-EG')}
                      <div className="text-[11px] text-zinc-400">
                        {new Date(exp.createdAt).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-zinc-900">
                      {exp.categoryNameAr}
                    </td>
                    <td className="px-4 py-3.5 text-zinc-700 max-w-xs truncate" title={exp.description}>
                      {exp.description}
                    </td>
                    <td className="px-4 py-3.5">
                      {exp.source === ExpenseSource.REGISTER_CASH ? (
                        <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 border border-amber-200">
                          درج الكاشير
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-800 border border-indigo-200">
                          الخزينة المركزية
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-zinc-600">
                      {exp.receiptNumber || '—'}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-zinc-900">
                      {formatMoney(exp.amountMinor)}
                    </td>
                    <td className="px-4 py-3.5 text-zinc-600">
                      {exp.spentByName}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
