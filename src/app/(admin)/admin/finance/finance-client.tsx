'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  Receipt,
  TrendingUp,
  Plus,
  ArrowDownUp,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Lock,
  X,
  FileText,
} from 'lucide-react';
import { FinancePageData } from './finance.types';
import {
  CashShiftDetail,
} from '../../../../domain/finance/contracts/finance.repository';
import { CashMovementType, ExpenseSource, CashShiftStatus } from '../../../../domain/finance/enums';
import {
  createExpenseAction,
  recordCashMovementAction,
  blindCloseCashShiftAction,
  auditCashShiftAction,
  getShiftDetailsAction,
} from '../../../actions/finance.actions';

interface FinanceClientProps {
  initialData: FinancePageData;
}

export function FinanceClient({ initialData }: FinanceClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<'shifts' | 'expenses' | 'profitability'>('shifts');

  // Modals state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showBlindCloseModal, setShowBlindCloseModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Selected shift for actions/details
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [shiftDetail, setShiftDetail] = useState<CashShiftDetail | null>(null);

  // Form states
  const [expenseForm, setExpenseForm] = useState({
    categoryId: initialData.categories[0]?.id ?? '',
    amount: '',
    source: ExpenseSource.REGISTER_CASH,
    description: '',
    receiptNumber: '',
  });

  const [movementForm, setMovementForm] = useState({
    shiftId: initialData.activeShift?.id ?? (initialData.shifts.find((s) => s.status === CashShiftStatus.OPEN)?.id ?? ''),
    type: CashMovementType.CASH_IN,
    amount: '',
    reason: '',
  });

  const [blindCloseForm, setBlindCloseForm] = useState({
    countedCash: '',
    varianceReason: '',
  });

  const [auditForm, setAuditForm] = useState({
    notes: '',
  });

  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filter states
  const [expenseSourceFilter, setExpenseSourceFilter] = useState<'ALL' | ExpenseSource>('ALL');
  const [shiftStatusFilter, setShiftStatusFilter] = useState<'ALL' | CashShiftStatus>('ALL');

  const formatMoney = (minor: number | null | undefined): string => {
    if (minor === null || minor === undefined) return `0.00 ${initialData.currencySymbol}`;
    const major = minor / 100;
    return `${major.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${initialData.currencySymbol}`;
  };

  const handleBranchChange = (newBranchId: string) => {
    document.cookie = `resto_active_branch_id=${newBranchId}; path=/; max-age=31536000; SameSite=Lax`;
    startTransition(() => {
      router.refresh();
    });
  };

  const openShiftDetails = async (shiftId: string) => {
    setSelectedShiftId(shiftId);
    setFeedback(null);
    const res = await getShiftDetailsAction(shiftId, initialData.branchId);
    if (res.success && res.data) {
      setShiftDetail(res.data);
      setShowDetailsModal(true);
    } else {
      setFeedback({ message: !res.success ? res.error : 'تعذر تحميل التفاصيل', type: 'error' });
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const amountVal = parseFloat(expenseForm.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setFeedback({ message: 'يرجى إدخال مبلغ صحيح وموجب', type: 'error' });
      return;
    }

    startTransition(async () => {
      const res = await createExpenseAction({
        branchId: initialData.branchId,
        categoryId: expenseForm.categoryId,
        amountMinor: Math.round(amountVal * 100),
        source: expenseForm.source,
        description: expenseForm.description,
        receiptNumber: expenseForm.receiptNumber || null,
      });

      if (res.success) {
        setFeedback({ message: 'تم تسجيل المصروف بنجاح', type: 'success' });
        setShowExpenseModal(false);
        setExpenseForm({
          categoryId: initialData.categories[0]?.id ?? '',
          amount: '',
          source: ExpenseSource.REGISTER_CASH,
          description: '',
          receiptNumber: '',
        });
        router.refresh();
      } else {
        setFeedback({ message: res.error, type: 'error' });
      }
    });
  };

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const amountVal = parseFloat(movementForm.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setFeedback({ message: 'يرجى إدخال مبلغ حركة صحيح وموجب', type: 'error' });
      return;
    }
    if (!movementForm.shiftId) {
      setFeedback({ message: 'يرجى اختيار الوردية المفتوحة المستهدفة', type: 'error' });
      return;
    }

    startTransition(async () => {
      const res = await recordCashMovementAction({
        branchId: initialData.branchId,
        shiftId: movementForm.shiftId,
        type: movementForm.type,
        amountMinor: Math.round(amountVal * 100),
        reason: movementForm.reason,
      });

      if (res.success) {
        setFeedback({ message: 'تم تسجيل الحركة النقدية بنجاح', type: 'success' });
        setShowMovementModal(false);
        setMovementForm({
          shiftId: initialData.activeShift?.id ?? '',
          type: CashMovementType.CASH_IN,
          amount: '',
          reason: '',
        });
        router.refresh();
      } else {
        setFeedback({ message: res.error, type: 'error' });
      }
    });
  };

  const handleBlindClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShiftId) return;
    setFeedback(null);
    const countVal = parseFloat(blindCloseForm.countedCash);
    if (isNaN(countVal) || countVal < 0) {
      setFeedback({ message: 'يرجى إدخال مبلغ النقد الفعلي بشكل صحيح', type: 'error' });
      return;
    }

    startTransition(async () => {
      const res = await blindCloseCashShiftAction({
        shiftId: selectedShiftId,
        branchId: initialData.branchId,
        countedCashMinor: Math.round(countVal * 100),
        varianceReason: blindCloseForm.varianceReason || undefined,
      });

      if (res.success) {
        setFeedback({ message: 'تم إغلاق الوردية وحساب العجز/الزيادة بنجاح', type: 'success' });
        setShowBlindCloseModal(false);
        setBlindCloseForm({ countedCash: '', varianceReason: '' });
        router.refresh();
      } else {
        setFeedback({ message: res.error, type: 'error' });
      }
    });
  };

  const handleAuditShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShiftId) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await auditCashShiftAction({
        shiftId: selectedShiftId,
        branchId: initialData.branchId,
        notes: auditForm.notes || undefined,
      });

      if (res.success) {
        setFeedback({ message: 'تم اعتماد وتدقيق الوردية بنجاح', type: 'success' });
        setShowAuditModal(false);
        setAuditForm({ notes: '' });
        router.refresh();
      } else {
        setFeedback({ message: res.error, type: 'error' });
      }
    });
  };

  // Filtered views
  const filteredShifts = initialData.shifts.filter((s) => {
    if (shiftStatusFilter === 'ALL') return true;
    return s.status === shiftStatusFilter;
  });

  const filteredExpenses = initialData.expenses.filter((e) => {
    if (expenseSourceFilter === 'ALL') return true;
    return e.source === expenseSourceFilter;
  });

  const openShiftsCount = initialData.shifts.filter((s) => s.status === CashShiftStatus.OPEN).length;
  const pendingAuditCount = initialData.shifts.filter((s) => s.status === CashShiftStatus.CLOSED).length;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8" dir="rtl">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <Wallet className="h-5 w-5 text-zinc-100" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">
                المالية والورديات والمصروفات
              </h1>
              <p className="text-xs text-zinc-500 sm:text-sm">
                متابعة حركة النقد بالأدراج، تسجيل المصروفات الميدانية، ومجمل أرباح التشغيل
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Branch Selector */}
          {initialData.allowedBranches.length > 1 && (
            <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-xs">
              <Building2 className="h-4 w-4 text-zinc-500" strokeWidth={1.75} />
              <select
                value={initialData.branchId}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="bg-transparent font-medium text-zinc-800 outline-hidden"
              >
                {initialData.allowedBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nameAr}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Action: Record Cash Movement */}
          <button
            type="button"
            onClick={() => {
              setFeedback(null);
              setShowMovementModal(true);
            }}
            className="flex min-h-11 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-xs transition-colors hover:bg-zinc-50 sm:text-sm"
          >
            <ArrowDownUp className="h-4 w-4 text-zinc-600" strokeWidth={1.75} />
            <span>إيداع / سحب نقد</span>
          </button>

          {/* Quick Action: Record Expense */}
          <button
            type="button"
            onClick={() => {
              setFeedback(null);
              setShowExpenseModal(true);
            }}
            className="flex min-h-11 items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-zinc-800 sm:text-sm"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            <span>تسجيل مصروف</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-lg p-3.5 text-xs sm:text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 text-zinc-400 hover:text-zinc-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('shifts')}
          className={`flex min-h-11 items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'shifts'
              ? 'border-zinc-900 text-zinc-900 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <Wallet className="h-4 w-4" strokeWidth={1.75} />
          <span>ورديات الكاشير النقدية</span>
          {openShiftsCount > 0 && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
              {openShiftsCount} نشطة
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`flex min-h-11 items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'expenses'
              ? 'border-zinc-900 text-zinc-900 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <Receipt className="h-4 w-4" strokeWidth={1.75} />
          <span>المصروفات والنثريات</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
            {initialData.expenses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profitability')}
          className={`flex min-h-11 items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'profitability'
              ? 'border-zinc-900 text-zinc-900 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <TrendingUp className="h-4 w-4" strokeWidth={1.75} />
          <span>الأرباح وتكلفة البضاعة المباعة (COGS)</span>
        </button>
      </div>

      {/* TAB 1: CASH SHIFTS */}
      {activeTab === 'shifts' && (
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
                <span className="text-xs font-medium">إجمالي مبيعات اليوم (المسجلة)</span>
                <DollarSign className="h-4 w-4 text-zinc-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-zinc-900">
                {formatMoney(
                  initialData.shifts.reduce((acc, s) => acc + s.totalSalesMinor, 0)
                )}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">من كافة ورديات الفرع المحملة</p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-xs font-medium">صافي الفروقات (عجز / زيادة)</span>
                <Wallet className="h-4 w-4 text-zinc-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-zinc-900">
                {formatMoney(
                  initialData.shifts.reduce((acc, s) => acc + (s.varianceMinor ?? 0), 0)
                )}
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
                      onClick={() => setShiftStatusFilter(st)}
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
                                onClick={() => openShiftDetails(shift.id)}
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
                                  onClick={() => {
                                    setSelectedShiftId(shift.id);
                                    setBlindCloseForm({ countedCash: '', varianceReason: '' });
                                    setShowBlindCloseModal(true);
                                  }}
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
                                  onClick={() => {
                                    setSelectedShiftId(shift.id);
                                    setAuditForm({ notes: '' });
                                    setShowAuditModal(true);
                                  }}
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
      )}

      {/* TAB 2: EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          {/* KPI Cards for Expenses */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-xs font-medium">إجمالي المصروفات</span>
                <Receipt className="h-4 w-4 text-zinc-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-zinc-900">
                {formatMoney(
                  initialData.expenses.reduce((acc, e) => acc + e.amountMinor, 0)
                )}
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
                  initialData.expenses
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
                  initialData.expenses
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
                      onClick={() => setExpenseSourceFilter(src)}
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
      )}

      {/* TAB 3: PROFITABILITY & COGS */}
      {activeTab === 'profitability' && (
        <div className="space-y-6">
          {/* Executive P&L Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
              <span className="text-xs font-medium text-zinc-500">صافي المبيعات (Revenue)</span>
              <p className="mt-2 text-2xl font-bold text-zinc-900">
                {formatMoney(initialData.report.netSalesMinor)}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">
                {initialData.report.totalOrdersCount} طلب مكتمل ومسلّم
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-xs font-medium">تكلفة البضاعة المباعة (COGS)</span>
                <span className="text-[11px] font-semibold text-rose-600">
                  {initialData.report.cogsPercent}%
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-rose-700">
                {formatMoney(initialData.report.cogsMinor)}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">من استهلاك وصفات الـ BOM والمخزون</p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
              <span className="text-xs font-medium text-zinc-500">المصروفات التشغيلية الميدانية</span>
              <p className="mt-2 text-2xl font-bold text-amber-700">
                {formatMoney(initialData.report.operatingExpensesMinor)}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">نثريات وصيانة ومرافق</p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-xs font-medium">مجمل الربح التشغيلي</span>
                <span className="text-[11px] font-semibold text-emerald-600">
                  {initialData.report.grossMarginPercent}%
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-700">
                {formatMoney(initialData.report.grossProfitMinor)}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">(المبيعات - تكلفة البضاعة)</p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-xs font-medium">صافي هامش التشغيل</span>
                <span className="text-[11px] font-semibold text-zinc-800">
                  {initialData.report.operatingMarginPercent}%
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-zinc-900">
                {formatMoney(initialData.report.operatingProfitMinor)}
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
              {initialData.report.expensesByCategory.length === 0 ? (
                <p className="py-6 text-center text-xs text-zinc-400">لا توجد مصروفات مسجلة في هذه الفترة</p>
              ) : (
                <div className="space-y-3">
                  {initialData.report.expensesByCategory.map((c) => (
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
              {initialData.report.dailyBreakdown.length === 0 ? (
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
                      {initialData.report.dailyBreakdown.map((d) => (
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
      )}

      {/* MODAL 1: CREATE EXPENSE */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-zinc-700" />
                <span>تسجيل مصروف تشغيلي ميداني</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-medium text-zinc-700 mb-1">تصنيف المصروف *</label>
                <select
                  value={expenseForm.categoryId}
                  onChange={(e) => setExpenseForm({ ...expenseForm, categoryId: e.target.value })}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                  required
                >
                  {initialData.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">مصدر الصرف المالي *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExpenseForm({ ...expenseForm, source: ExpenseSource.REGISTER_CASH })}
                    className={`rounded-lg border p-2 text-center font-medium transition-colors ${
                      expenseForm.source === ExpenseSource.REGISTER_CASH
                        ? 'border-zinc-900 bg-zinc-900 text-white'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    درج الكاشير (الوردية)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseForm({ ...expenseForm, source: ExpenseSource.SAFE_PETTY_CASH })}
                    className={`rounded-lg border p-2 text-center font-medium transition-colors ${
                      expenseForm.source === ExpenseSource.SAFE_PETTY_CASH
                        ? 'border-zinc-900 bg-zinc-900 text-white'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    الخزينة / العهدة
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-zinc-500">
                  {expenseForm.source === ExpenseSource.REGISTER_CASH
                    ? 'يُخصم حتمياً من نقدية الدرج ويؤثر على رصيد إغلاق الوردية الحالية'
                    : 'يُصرف من الخزينة المركزية ولا يمس درج كاشير نقطة البيع'}
                </p>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">
                  المبلغ ({initialData.currencySymbol}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="مثال: 50.00"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">البيان والتفاصيل *</label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="سبب الصرف بوضوح..."
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">
                  رقم السند أو الفاتورة (اختياري)
                </label>
                <input
                  type="text"
                  value={expenseForm.receiptNumber}
                  onChange={(e) => setExpenseForm({ ...expenseForm, receiptNumber: e.target.value })}
                  placeholder="مثال: INV-1049"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isPending ? 'جاري الحفظ...' : 'حفظ المصروف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CASH MOVEMENT (IN / DROP) */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <ArrowDownUp className="h-5 w-5 text-zinc-700" />
                <span>تسجيل حركة نقدية في الوردية</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowMovementModal(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordMovement} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-medium text-zinc-700 mb-1">الوردية المفتوحة *</label>
                <select
                  value={movementForm.shiftId}
                  onChange={(e) => setMovementForm({ ...movementForm, shiftId: e.target.value })}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                  required
                >
                  <option value="">اختر وردية مفتوحة...</option>
                  {initialData.shifts
                    .filter((s) => s.status === CashShiftStatus.OPEN)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.cashierName} — افتتحت {new Date(s.openedAt).toLocaleTimeString('ar-EG')}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">نوع الحركة *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementForm({ ...movementForm, type: CashMovementType.CASH_IN })}
                    className={`rounded-lg border p-2 text-center font-medium transition-colors ${
                      movementForm.type === CashMovementType.CASH_IN
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    إيداع نقد / تغذية فكة
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementForm({ ...movementForm, type: CashMovementType.CASH_DROP })}
                    className={`rounded-lg border p-2 text-center font-medium transition-colors ${
                      movementForm.type === CashMovementType.CASH_DROP
                        ? 'border-rose-600 bg-rose-600 text-white'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    سحب / توريد للخزينة
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">
                  المبلغ ({initialData.currencySymbol}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={movementForm.amount}
                  onChange={(e) => setMovementForm({ ...movementForm, amount: e.target.value })}
                  placeholder="مثال: 200.00"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">سبب وتفاصيل الحركة *</label>
                <input
                  type="text"
                  value={movementForm.reason}
                  onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
                  placeholder="سبب تزويد الفكة أو سحب التوريد..."
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isPending ? 'جاري المعالجة...' : 'تسجيل الحركة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: BLIND CLOSE SHIFT */}
      {showBlindCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Lock className="h-5 w-5 text-amber-600" />
                <span>الإغلاق الأعمى للوردية النقدية</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowBlindCloseModal(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBlindClose} className="space-y-4 text-xs sm:text-sm">
              <div className="rounded-lg bg-amber-50 p-3 border border-amber-200 text-amber-800 text-xs">
                قم بعد النقدية الفعلية الموجودة في الدرج وإدخالها هنا. سيقوم النظام بحساب ومقارنة
                الرصيد الدفتري آلياً لمنع أي تلاعب وتوثيق العجز أو الزيادة.
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">
                  إجمالي النقد الفعلي المعدود بالدرج ({initialData.currencySymbol}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={blindCloseForm.countedCash}
                  onChange={(e) => setBlindCloseForm({ ...blindCloseForm, countedCash: e.target.value })}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 font-mono text-lg font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">
                  ملاحظات أو تبرير الفارق (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={blindCloseForm.varianceReason}
                  onChange={(e) => setBlindCloseForm({ ...blindCloseForm, varianceReason: e.target.value })}
                  placeholder="أي ملاحظات حول عد النقد أو الفروقات..."
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBlindCloseModal(false)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {isPending ? 'جاري الإغلاق...' : 'تأكيد إغلاق الوردية'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: AUDIT SHIFT */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>اعتماد وتدقيق الوردية والفروقات</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAuditShift} className="space-y-4 text-xs sm:text-sm">
              <div className="rounded-lg bg-zinc-50 p-3 border border-zinc-200 text-zinc-700 text-xs">
                باعتماد هذه الوردية، يتم إقفالها نهائياً كـ (معتمدة ومطابقة إدارياً) وتثبيت فروقات
                العجز أو الزيادة في السجلات المحاسبية الرسمية للفرع.
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">ملاحظات المدير والاعتماد</label>
                <textarea
                  rows={3}
                  value={auditForm.notes}
                  onChange={(e) => setAuditForm({ notes: e.target.value })}
                  placeholder="ملاحظات التحقق من الفروقات إن وُجدت..."
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAuditModal(false)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isPending ? 'جاري الاعتماد...' : 'اعتماد الوردية رسمياً'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: DETAILED SHIFT BREAKDOWN */}
      {showDetailsModal && shiftDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-zinc-700" />
                  <span>تفاصيل جلسة الوردية — {shiftDetail.cashierName}</span>
                </h3>
                <span className="text-xs text-zinc-500">
                  افتتحت: {new Date(shiftDetail.openedAt).toLocaleString('ar-EG')}
                  {shiftDetail.closedAt && ` | أغلقت: ${new Date(shiftDetail.closedAt).toLocaleString('ar-EG')}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Shift Financial Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-lg bg-zinc-50 p-3 border border-zinc-200">
                <span className="text-zinc-500 block">رصيد الافتتاح</span>
                <span className="font-mono font-bold text-zinc-900 text-sm">
                  {formatMoney(shiftDetail.openingCashMinor)}
                </span>
              </div>

              <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-200">
                <span className="text-emerald-700 block">مبيعات نقدية (كاش)</span>
                <span className="font-mono font-bold text-emerald-800 text-sm">
                  {formatMoney(shiftDetail.cashSalesMinor)}
                </span>
              </div>

              <div className="rounded-lg bg-indigo-50 p-3 border border-indigo-200">
                <span className="text-indigo-700 block">مبيعات شبكة (بطاقة)</span>
                <span className="font-mono font-bold text-indigo-800 text-sm">
                  {formatMoney(shiftDetail.cardSalesMinor)}
                </span>
              </div>

              <div className="rounded-lg bg-zinc-50 p-3 border border-zinc-200">
                <span className="text-zinc-500 block">إجمالي مبيعات الوردية</span>
                <span className="font-mono font-bold text-zinc-900 text-sm">
                  {formatMoney(shiftDetail.totalSalesMinor)}
                </span>
              </div>
            </div>

            {/* Reconciliation Box */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 space-y-2 text-xs sm:text-sm">
              <h4 className="font-semibold text-zinc-900 mb-2">معادلة مطابقة النقدية بالدرج:</h4>
              <div className="flex justify-between py-1 border-b border-zinc-200 text-zinc-700">
                <span>+ رصيد الافتتاح:</span>
                <span className="font-mono">{formatMoney(shiftDetail.openingCashMinor)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-200 text-emerald-700">
                <span>+ مبيعات كاش محصلة:</span>
                <span className="font-mono">{formatMoney(shiftDetail.cashSalesMinor)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-200 text-sky-700">
                <span>+ إيداعات فكة (Cash In):</span>
                <span className="font-mono">{formatMoney(shiftDetail.cashInMinor)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-200 text-rose-700">
                <span>- سحوبات وتوريدات (Cash Drop):</span>
                <span className="font-mono">{formatMoney(shiftDetail.cashDropMinor)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-200 text-amber-700">
                <span>- مصروفات سُحبت من الدرج:</span>
                <span className="font-mono">{formatMoney(shiftDetail.registerExpensesMinor)}</span>
              </div>
              <div className="flex justify-between py-1.5 font-bold text-zinc-900 border-t-2 border-zinc-300">
                <span>= النقد المتوقع بالدرج:</span>
                <span className="font-mono">{formatMoney(shiftDetail.expectedCashMinor)}</span>
              </div>
              <div className="flex justify-between py-1.5 font-bold text-zinc-900">
                <span>= النقد الفعلي المعدود:</span>
                <span className="font-mono">{formatMoney(shiftDetail.closingCashMinor)}</span>
              </div>
              <div className="flex justify-between py-1.5 font-bold border-t border-zinc-200">
                <span>الفارق (عجز / زيادة):</span>
                <span
                  className={`font-mono text-base ${
                    (shiftDetail.varianceMinor ?? 0) < 0
                      ? 'text-rose-600'
                      : (shiftDetail.varianceMinor ?? 0) > 0
                      ? 'text-sky-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {(shiftDetail.varianceMinor ?? 0) === 0
                    ? 'مطابق تماماً'
                    : formatMoney(shiftDetail.varianceMinor)}
                </span>
              </div>
              {shiftDetail.varianceReason && (
                <div className="mt-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900 border border-amber-200">
                  <span className="font-bold">تبرير الفارق وملاحظات الإدارة: </span>
                  {shiftDetail.varianceReason}
                </div>
              )}
            </div>

            {/* Cash Movements List */}
            {shiftDetail.movements.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-zinc-900 text-xs sm:text-sm">
                  الحركات النقدية أثناء الوردية ({shiftDetail.movements.length}):
                </h4>
                <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 overflow-hidden text-xs">
                  {shiftDetail.movements.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-2.5 bg-white">
                      <div className="flex items-center gap-2">
                        {m.type === CashMovementType.CASH_IN ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
                            إيداع فكة
                          </span>
                        ) : (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 font-semibold text-rose-800">
                            سحب توريد
                          </span>
                        )}
                        <span className="text-zinc-700">{m.reason}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-zinc-900">{formatMoney(m.amountMinor)}</span>
                        <span className="text-zinc-400 text-[11px]">{m.performedByName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drawer Expenses List */}
            {shiftDetail.drawerExpenses.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-zinc-900 text-xs sm:text-sm">
                  مصروفات صُرفت من الدرج ({shiftDetail.drawerExpenses.length}):
                </h4>
                <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 overflow-hidden text-xs">
                  {shiftDetail.drawerExpenses.map((e) => (
                    <div key={e.id} className="flex items-center justify-between p-2.5 bg-white">
                      <div>
                        <span className="font-semibold text-zinc-800">{e.categoryNameAr}: </span>
                        <span className="text-zinc-600">{e.description}</span>
                      </div>
                      <span className="font-mono font-bold text-amber-700">{formatMoney(e.amountMinor)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 text-xs sm:text-sm"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
