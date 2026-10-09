'use client';

import React, { useState } from 'react';
import {
  X,
  Printer,
  Building2,
  Phone,
  MapPin,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  ChefHat,
  PackageCheck,
  Truck,
  CheckCheck,
  Ban,
  XCircle,
  Loader2,
  FileText,
  Bike,
} from 'lucide-react';
import { OrderStatus, PaymentMethod } from '../../../../domain/ordering/enums';
import { OrderStateMachineService } from '../../../../domain/ordering/services/order-state-machine.service';

export interface OrderItemDetail {
  id: string;
  productId: string;
  productNameAr: string;
  productNameEn: string;
  sizeNameAr?: string | null;
  sizeNameEn?: string | null;
  quantity: number;
  unitPriceMinor: number;
  totalPriceMinor: number;
  modifiers: Array<{
    id: string;
    nameAr: string;
    nameEn: string;
    priceDeltaMinor: number;
  }>;
}

export interface DetailedOrder {
  id: string;
  orderNumber: string;
  source: string;
  type: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotalMinor: number;
  deliveryFeeMinor: number;
  taxMinor: number;
  discountMinor: number;
  totalMinor: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string | null;
  deliveryNotes?: string | null;
  customerNotes?: string | null;
  cancelReason?: string | null;
  createdAt: Date | string;
  branchId?: string | null;
  driverId?: string | null;
  driverName?: string | null;
  dispatchedAt?: Date | string | null;
  deliveredAt?: Date | string | null;
  driverSettlementId?: string | null;
  driver?: {
    id: string;
    fullName: string;
    phone: string;
    vehicleType?: string;
  } | null;
  branch?: {
    id: string;
    nameAr: string;
    nameEn: string;
    code: string;
    phone?: string | null;
    address?: string | null;
  } | null;
  customer?: {
    id: string;
    fullName: string;
    phone: string;
    totalOrders: number;
    totalSpent: number;
  } | null;
  items: OrderItemDetail[];
}

export interface BranchOption {
  id: string;
  nameAr: string;
  code: string;
  isActive: boolean;
}

interface OrderDetailModalProps {
  order: DetailedOrder;
  branches: BranchOption[];
  currencySymbol?: string;
  canAssignBranch?: boolean;
  onClose: () => void;
  onAssignBranch: (orderId: string, branchId: string) => Promise<boolean>;
  onUpdateStatus: (orderId: string, nextStatus: OrderStatus, cancelReason?: string) => Promise<boolean>;
  onPrint: () => void;
  onPrintKot?: () => void;
  onStartDispatch?: (order: DetailedOrder) => void;
}

export function OrderDetailModal({
  order,
  branches,
  currencySymbol = 'ج.م',
  canAssignBranch = true,
  onClose,
  onAssignBranch,
  onUpdateStatus,
  onPrint,
  onPrintKot,
  onStartDispatch,
}: OrderDetailModalProps) {
  const [selectedBranchId, setSelectedBranchId] = useState<string>(order.branchId || '');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Cancellation prompt state
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelStatusTarget, setCancelStatusTarget] = useState<OrderStatus | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');

  const formatMoney = (minor: number) => (minor / 100).toFixed(2);
  const currentStatus = order.status as OrderStatus;
  const isTerminal = OrderStateMachineService.isTerminalStatus(currentStatus);
  const allowedTransitions = OrderStateMachineService.getAllowedTransitions(currentStatus, order.type);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case OrderStatus.PENDING:
        return { label: 'جديد قيد المراجعة', cls: 'bg-blue-100 text-blue-800 border-blue-200' };
      case OrderStatus.CONFIRMED:
        return { label: 'تم التأكيد', cls: 'bg-amber-100 text-amber-800 border-amber-200' };
      case OrderStatus.PREPARING:
        return { label: 'جاري التجهيز', cls: 'bg-orange-100 text-orange-800 border-orange-200' };
      case OrderStatus.READY_FOR_PICKUP:
        return { label: 'جاهز للتوصيل', cls: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case OrderStatus.OUT_FOR_DELIVERY:
        return { label: 'في الطريق مع المندوب', cls: 'bg-purple-100 text-purple-800 border-purple-200' };
      case OrderStatus.DELIVERED:
        return { label: 'تم التسليم بنجاح', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case OrderStatus.CANCELLED:
        return { label: 'ملغي', cls: 'bg-rose-100 text-rose-800 border-rose-200' };
      case OrderStatus.REJECTED:
        return { label: 'مرفوض', cls: 'bg-zinc-200 text-zinc-800 border-zinc-300' };
      default:
        return { label: status, cls: 'bg-zinc-100 text-zinc-800 border-zinc-200' };
    }
  };

  const badge = getStatusBadge(order.status);

  const handleBranchAssignSubmit = async () => {
    if (!selectedBranchId || selectedBranchId === order.branchId) return;
    setActionError(null);
    setIsAssigning(true);
    try {
      const ok = await onAssignBranch(order.id, selectedBranchId);
      if (!ok) {
        setActionError('تعذر إسناد الفرع، يرجى المحاولة لاحقاً');
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'حدث خطأ أثناء إسناد الفرع');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleStatusTransitionClick = async (targetStatus: OrderStatus) => {
    setActionError(null);

    // If target requires a reason (CANCELLED or REJECTED)
    if (targetStatus === OrderStatus.CANCELLED || targetStatus === OrderStatus.REJECTED) {
      setCancelStatusTarget(targetStatus);
      setShowCancelPrompt(true);
      return;
    }

    // Business check before executing
    if (targetStatus === OrderStatus.PREPARING && !order.branchId) {
      setActionError('يجب إسناد الطلب لفرع تشغيلي أولاً قبل بدء التجهيز بالمطبخ');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const ok = await onUpdateStatus(order.id, targetStatus);
      if (!ok) {
        setActionError('تعذر تحديث حالة الطلب');
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحديث حالة الطلب');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleConfirmCancelPrompt = async () => {
    if (!cancelStatusTarget) return;
    if (!cancelReasonInput.trim()) {
      setActionError('يرجى كتابة سبب الإلغاء أو الرفض للتوثيق');
      return;
    }

    setActionError(null);
    setIsUpdatingStatus(true);
    try {
      const ok = await onUpdateStatus(order.id, cancelStatusTarget, cancelReasonInput.trim());
      if (ok) {
        setShowCancelPrompt(false);
        setCancelReasonInput('');
      } else {
        setActionError('تعذر إلغاء الطلب، يرجى المحاولة لاحقاً');
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'حدث خطأ أثناء الإلغاء');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const renderTransitionButton = (targetStatus: OrderStatus) => {
    switch (targetStatus) {
      case OrderStatus.CONFIRMED:
        return (
          <button
            key={targetStatus}
            type="button"
            onClick={() => handleStatusTransitionClick(targetStatus)}
            disabled={isUpdatingStatus}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>تأكيد الطلب</span>
          </button>
        );
      case OrderStatus.PREPARING:
        return (
          <button
            key={targetStatus}
            type="button"
            onClick={() => handleStatusTransitionClick(targetStatus)}
            disabled={isUpdatingStatus || !order.branchId}
            title={!order.branchId ? 'يرجى إسناد فرع أولاً' : ''}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition shadow-xs ${
              !order.branchId
                ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>بدء التجهيز بالمطبخ</span>
          </button>
        );
      case OrderStatus.READY_FOR_PICKUP:
        return (
          <button
            key={targetStatus}
            type="button"
            onClick={() => handleStatusTransitionClick(targetStatus)}
            disabled={isUpdatingStatus}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-xs"
          >
            <PackageCheck className="w-4 h-4" />
            <span>جاهز للتوصيل</span>
          </button>
        );
      case OrderStatus.OUT_FOR_DELIVERY:
        return (
          <button
            key={targetStatus}
            type="button"
            onClick={() => {
              if (onStartDispatch) {
                onStartDispatch(order);
              } else {
                handleStatusTransitionClick(targetStatus);
              }
            }}
            disabled={isUpdatingStatus}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition shadow-xs"
          >
            <Truck className="w-4 h-4" />
            <span>تسليم للمندوب (في الطريق)</span>
          </button>
        );
      case OrderStatus.COMPLETED:
        return (
          <button
            key={targetStatus}
            type="button"
            onClick={() => handleStatusTransitionClick(targetStatus)}
            disabled={isUpdatingStatus}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-xs"
          >
            <CheckCheck className="w-4 h-4" />
            <span>تسليم للزبون (إتمام الطلب)</span>
          </button>
        );
      case OrderStatus.DELIVERED:
        return (
          <button
            key={targetStatus}
            type="button"
            onClick={() => handleStatusTransitionClick(targetStatus)}
            disabled={isUpdatingStatus}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-xs"
          >
            <CheckCheck className="w-4 h-4" />
            <span>تأكيد التسليم والتحصيل</span>
          </button>
        );
      case OrderStatus.CANCELLED:
        return (
          <button
            key={targetStatus}
            type="button"
            onClick={() => handleStatusTransitionClick(targetStatus)}
            disabled={isUpdatingStatus}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 transition"
          >
            <Ban className="w-4 h-4" />
            <span>إلغاء الطلب</span>
          </button>
        );
      case OrderStatus.REJECTED:
        return (
          <button
            key={targetStatus}
            type="button"
            onClick={() => handleStatusTransitionClick(targetStatus)}
            disabled={isUpdatingStatus}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-100 transition"
          >
            <XCircle className="w-4 h-4" />
            <span>رفض الطلب</span>
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      dir="rtl"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-3xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                  طلب {order.orderNumber}
                </h2>
                <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(order.createdAt).toLocaleString('ar-EG', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
                <span>•</span>
                <span>توصيل طلبات (Delivery)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 transition"
              title="طباعة إيصال الطلب"
            >
              <Printer className="w-4 h-4 text-zinc-600" />
              <span className="hidden sm:inline">طباعة الإيصال</span>
            </button>

            {onPrintKot && (
              <button
                type="button"
                onClick={onPrintKot}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 transition"
                title="طباعة بون المطبخ (KOT)"
              >
                <ChefHat className="w-4 h-4 text-zinc-600" />
                <span className="hidden sm:inline">بون المطبخ (KOT)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {actionError && (
            <div className="p-3 text-xs rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Cancellation Reason Alert if Cancelled/Rejected */}
          {(order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REJECTED) && (
            <div className="p-3 text-xs rounded-lg bg-rose-50 border border-rose-200 text-rose-800">
              <span className="font-bold">سبب الإلغاء/الرفض المسجل: </span>
              <span>{order.cancelReason || 'لم يُحدد سبب'}</span>
            </div>
          )}

          {/* Prompt Dialog for cancellation */}
          {showCancelPrompt && (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/70 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-rose-900">
                <Ban className="w-4 h-4 text-rose-600" />
                <span>
                  {cancelStatusTarget === OrderStatus.REJECTED ? 'رفض الطلب' : 'إلغاء الطلب'}
                </span>
              </div>
              <p className="text-xs text-rose-700">
                يرجى كتابة سبب الإلغاء بوضوح لحفظه في سجل وتاريخ الطلب:
              </p>
              <textarea
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                placeholder="مثال: تعذر التواصل مع العميل، أو خارج نطاق التوصيل..."
                className="w-full text-xs p-2.5 rounded-lg border border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                rows={2}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCancelPrompt(false)}
                  className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 rounded-lg"
                >
                  تراجع
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancelPrompt}
                  disabled={isUpdatingStatus || !cancelReasonInput.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-700 text-white hover:bg-rose-800 disabled:opacity-50"
                >
                  {isUpdatingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>تأكيد الإلغاء</span>
                </button>
              </div>
            </div>
          )}

          {/* Operational Branch Assignment Bar */}
          <div className="bg-zinc-50 border border-zinc-200 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-200/70 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-zinc-700" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-800 block">الفرع المسؤول عن التجهيز:</span>
                <span className="text-xs text-zinc-600">
                  {order.branch ? (
                    <span className="font-semibold text-emerald-800">
                      فرع {order.branch.nameAr} ({order.branch.code})
                    </span>
                  ) : (
                    <span className="text-rose-600 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      غير مسند لفرع حتى الآن
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Branch Assignment Form (allowed in PENDING and CONFIRMED for central dispatchers) */}
            {canAssignBranch ? (
              (order.status === OrderStatus.PENDING || order.status === OrderStatus.CONFIRMED) && (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="text-xs border border-zinc-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  >
                    <option value="">-- اختر الفرع --</option>
                    {branches
                      .filter((b) => b.isActive)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.nameAr} ({b.code})
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleBranchAssignSubmit}
                    disabled={isAssigning || !selectedBranchId || selectedBranchId === order.branchId}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-40 transition"
                  >
                    {isAssigning ? 'جاري الإسناد...' : order.branchId ? 'تغيير الفرع' : 'إسناد الفرع'}
                  </button>
                </div>
              )
            ) : (
              <span className="text-[11px] text-zinc-400">
                (إسناد وتغيير الفرع خاص بالإدارة المركزية)
              </span>
            )}
          </div>

          {/* Driver Assignment Card if assigned */}
          {(order.driverName || order.driver) && (
            <div className="bg-purple-50/70 border border-purple-200 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-200/70 flex items-center justify-center shrink-0">
                  <Bike className="w-4 h-4 text-purple-800" />
                </div>
                <div>
                  <span className="text-xs font-bold text-purple-900 block">كابتن التوصيل المكلف:</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-bold text-purple-950">
                      {order.driver?.fullName || order.driverName}
                    </span>
                    {order.dispatchedAt && (
                      <span className="text-[11px] text-purple-700">
                        (خرج للتوصيل:{' '}
                        {new Date(order.dispatchedAt).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        )
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {order.driver?.phone && (
                <a
                  href={`tel:${order.driver.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-700 text-white hover:bg-purple-800 transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span dir="ltr">{order.driver.phone}</span>
                </a>
              )}
            </div>
          )}

          {/* Customer & Address Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Box */}
            <div className="border border-zinc-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <div className="flex items-center gap-2 font-bold text-zinc-900">
                  <User className="w-4 h-4 text-zinc-500" />
                  <span>بيانات العميل</span>
                </div>
                {order.customer && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {order.customer.totalOrders > 1
                      ? `عميل دائم (${order.customer.totalOrders} طلبات)`
                      : 'عميل جديد (أول طلب)'}
                  </span>
                )}
              </div>
              <div className="space-y-1 pt-1">
                <div className="flex justify-between">
                  <span className="text-zinc-500">الاسم:</span>
                  <span className="font-semibold text-zinc-900">{order.customerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">الهاتف:</span>
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="flex items-center gap-1 font-semibold text-zinc-900 hover:text-emerald-700"
                    dir="ltr"
                  >
                    <Phone className="w-3 h-3 text-zinc-400" />
                    <span>{order.customerPhone}</span>
                  </a>
                </div>
                {order.customerNotes && (
                  <div className="mt-2 bg-amber-50/60 p-2 rounded border border-amber-200 text-amber-900">
                    <span className="font-bold">ملاحظات العميل: </span>
                    {order.customerNotes}
                  </div>
                )}
              </div>
            </div>

            {/* Address Box */}
            <div className="border border-zinc-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-zinc-900 border-b border-zinc-100 pb-2">
                <MapPin className="w-4 h-4 text-zinc-500" />
                <span>عنوان التوصيل</span>
              </div>
              <div className="space-y-1.5 pt-1 text-zinc-700">
                <p className="font-medium text-zinc-900 leading-relaxed">
                  {order.deliveryAddress || 'لم يحدد عنوان مفصل'}
                </p>
                {order.deliveryNotes && (
                  <div className="bg-zinc-100 p-2 rounded text-[11px] text-zinc-600">
                    <span className="font-bold">تعليمات التوصيل: </span>
                    {order.deliveryNotes}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ordered Items Table */}
          <div className="border border-zinc-200 rounded-xl overflow-hidden text-xs">
            <div className="bg-zinc-50 px-4 py-2.5 font-bold text-zinc-900 border-b border-zinc-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-500" />
              <span>الأصناف المطلوبة ({order.items.length})</span>
            </div>
            <div className="divide-y divide-zinc-100">
              {order.items.map((item) => (
                <div key={item.id} className="p-3.5 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-900">{item.productNameAr}</span>
                      {item.sizeNameAr && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                          {item.sizeNameAr}
                        </span>
                      )}
                    </div>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.modifiers.map((m) => (
                          <span
                            key={m.id}
                            className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600"
                          >
                            + {m.nameAr}
                            {m.priceDeltaMinor > 0 && ` (+${formatMoney(m.priceDeltaMinor)})`}
                          </span>
                        ))}
                      </div>
                    )}
                    <span className="text-[11px] text-zinc-500 block">
                      {item.quantity} × {formatMoney(item.unitPriceMinor)} {currencySymbol}
                    </span>
                  </div>
                  <div className="text-left font-bold text-zinc-900 shrink-0">
                    {formatMoney(item.totalPriceMinor)} {currencySymbol}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Breakdown Summary */}
          <div className="bg-zinc-50/70 border border-zinc-200 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-600">
              <span>المجموع الفرعي:</span>
              <span>{formatMoney(order.subtotalMinor)} {currencySymbol}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>رسوم خدمة التوصيل:</span>
              <span>{formatMoney(order.deliveryFeeMinor)} {currencySymbol}</span>
            </div>
            {order.taxMinor > 0 && (
              <div className="flex justify-between text-zinc-600">
                <span>ضريبة القيمة المضافة:</span>
                <span>{formatMoney(order.taxMinor)} {currencySymbol}</span>
              </div>
            )}
            {order.discountMinor > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>الخصم المطبق:</span>
                <span>-{formatMoney(order.discountMinor)} {currencySymbol}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-zinc-900 border-t border-zinc-200 pt-2">
              <span>الإجمالي النهائي:</span>
              <span className="text-base text-zinc-950">
                {formatMoney(order.totalMinor)} {currencySymbol}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] pt-1">
              <span className="text-zinc-500">طريقة وحالة الدفع:</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-800">
                  {order.paymentMethod === PaymentMethod.CASH ? 'الدفع نقداً عند الاستلام' : order.paymentMethod}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    order.paymentStatus === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {order.paymentStatus === 'PAID' ? 'مدفوع' : 'قيد التحصيل'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer (State Transition Controls) */}
        <div className="border-t border-zinc-100 bg-zinc-50/50 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-zinc-500">
            {isTerminal ? (
              <span className="font-semibold text-zinc-700">دورة حياة هذا الطلب مكتملة ({badge.label})</span>
            ) : (
              <span>الإجراءات المتاحة للمرحلة التالية:</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isTerminal && allowedTransitions.map((targetStatus) => renderTransitionButton(targetStatus))}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
