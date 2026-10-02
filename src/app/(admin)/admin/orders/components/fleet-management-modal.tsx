'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import {
  X,
  Bike,
  Car,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Clock,
  Banknote,
  Users,
  Printer,
  ChevronLeft,
} from 'lucide-react';
import { VehicleType, DriverStatus } from '../../../../../domain/delivery/enums';
import {
  listBranchDriversAction,
  saveDriverAction,
  getDriverPendingSettlementAction,
  settleDriverCashAction,
} from '../../../../actions/delivery.actions';
import { DriverViewItem } from '../../../../../application/delivery/use-cases/list-branch-drivers.use-case';
import { DriverSettlementPrintData } from './driver-settlement-receipt';

interface PendingSettlementData {
  driver: {
    id: string;
    fullName: string;
    phone: string;
    branchId: string;
    branchNameAr: string;
  };
  summary: {
    totalOrdersCount: number;
    codOrdersCount: number;
    prepaidOrdersCount: number;
    totalCollectedCashMinor: number;
    formattedCash: string;
    currency: string;
  };
  orders: Array<{
    id: string;
    orderNumber: string;
    customerName: string | null;
    totalMinor: number;
    paymentMethod: string;
    paymentStatus: string;
    driverId: string | null;
    deliveredAt: Date | string | null;
    driverSettlementId: string | null;
  }>;
  activeShift: {
    id: string;
    cashierName: string;
  } | null;
}

interface FleetManagementModalProps {
  branchId: string;
  branchName?: string;
  currencySymbol?: string;
  onClose: () => void;
  onSettlementCompleted: (printData: DriverSettlementPrintData) => void;
}

type TabType = 'ROSTER' | 'SETTLEMENTS';

export function FleetManagementModal({
  branchId,
  branchName = 'الفرع المحدد',
  currencySymbol = 'ج.م',
  onClose,
  onSettlementCompleted,
}: FleetManagementModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('ROSTER');
  const [drivers, setDrivers] = useState<DriverViewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Driver Form State
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newDriverVehicle, setNewDriverVehicle] = useState<VehicleType>(VehicleType.MOTORCYCLE);
  const [newDriverPlate, setNewDriverPlate] = useState('');

  // Settle Review State
  const [reviewingDriverId, setReviewingDriverId] = useState<string | null>(null);
  const [settlementDetails, setSettlementDetails] = useState<PendingSettlementData | null>(null);
  const [settlementNotes, setSettlementNotes] = useState('');
  const [isPending, startTransition] = useTransition();

  const loadDrivers = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const res = await listBranchDriversAction(branchId);
    if (res.success) {
      setDrivers(res.data);
    } else {
      setErrorMsg(res.error || 'فشل تحميل طياري الفرع');
    }
    setIsLoading(false);
  }, [branchId]);

  useEffect(() => {
    let isCurrent = true;
    async function init() {
      const res = await listBranchDriversAction(branchId);
      if (!isCurrent) return;
      if (res.success) {
        setDrivers(res.data);
      } else {
        setErrorMsg(res.error || 'فشل تحميل طياري الفرع');
      }
      setIsLoading(false);
    }
    init();
    return () => {
      isCurrent = false;
    };
  }, [branchId]);

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await saveDriverAction({
        branchId,
        fullName: newDriverName.trim(),
        phone: newDriverPhone.trim(),
        vehicleType: newDriverVehicle,
        licensePlate: newDriverPlate.trim() || undefined,
        status: DriverStatus.AVAILABLE,
        isActive: true,
      });

      if (res.success) {
        setSuccessMsg(`تمت إضافة الكابتن ${newDriverName} بنجاح`);
        setIsAddingDriver(false);
        setNewDriverName('');
        setNewDriverPhone('');
        setNewDriverPlate('');
        await loadDrivers();
      } else {
        setErrorMsg(res.error || 'فشل حفظ بيانات الطيار');
      }
    });
  };

  const handleOpenSettleReview = async (driverId: string) => {
    setReviewingDriverId(driverId);
    setErrorMsg(null);
    setSettlementDetails(null);

    startTransition(async () => {
      const res = await getDriverPendingSettlementAction(driverId);
      if (res.success) {
        setSettlementDetails(res.data);
      } else {
        setErrorMsg(res.error || 'فشل جلب تفاصيل العهدة');
      }
    });
  };

  const handleConfirmSettlement = () => {
    if (!reviewingDriverId) return;

    startTransition(async () => {
      setErrorMsg(null);
      const res = await settleDriverCashAction({
        branchId,
        driverId: reviewingDriverId,
        notes: settlementNotes.trim() || undefined,
      });

      if (res.success) {
        setSuccessMsg(`تم إقفال عهدة الكابتن ${res.data.driver.fullName} بنجاح`);
        setReviewingDriverId(null);
        setSettlementDetails(null);
        setSettlementNotes('');
        await loadDrivers();
        onSettlementCompleted(res.data as unknown as DriverSettlementPrintData);
      } else {
        setErrorMsg(res.error || 'فشل تسوية العهدة');
      }
    });
  };

  const getVehicleIcon = (vehicle: VehicleType) => {
    switch (vehicle) {
      case VehicleType.CAR:
        return <Car className="size-4 text-zinc-600" />;
      case VehicleType.BICYCLE:
        return <Bike className="size-4 text-zinc-600" />;
      case VehicleType.MOTORCYCLE:
      default:
        return <Bike className="size-4 text-zinc-600" />;
    }
  };

  const pendingSettlementDrivers = drivers.filter(
    (d) => d.pendingCashMinor > 0 || d.unsettledDeliveredCount > 0
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in"
      dir="rtl"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 bg-zinc-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-purple-100 text-purple-700">
              <Bike className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900">
                أسطول التوصيل والطيارين — {branchName}
              </h3>
              <p className="text-[11px] text-zinc-500">
                إدارة طاقم التوصيل وتوزيع الطلبات وتسوية العهد النقدية
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-zinc-200 px-5 py-2.5 bg-zinc-50 shrink-0 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('ROSTER');
              setReviewingDriverId(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition ${
              activeTab === 'ROSTER'
                ? 'bg-zinc-900 text-white shadow-2xs'
                : 'text-zinc-600 hover:bg-zinc-200/70'
            }`}
          >
            <Users className="size-3.5" />
            <span>طاقم الطيارين ({drivers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('SETTLEMENTS');
              setIsAddingDriver(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition ${
              activeTab === 'SETTLEMENTS'
                ? 'bg-zinc-900 text-white shadow-2xs'
                : 'text-zinc-600 hover:bg-zinc-200/70'
            }`}
          >
            <Banknote className="size-3.5" />
            <span>تسوية العهد النقدية ({pendingSettlementDrivers.length})</span>
          </button>

          <button
            type="button"
            onClick={loadDrivers}
            disabled={isLoading}
            className="mr-auto grid size-7 place-items-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
            title="تحديث البيانات"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Banners */}
        {errorMsg && (
          <div className="mx-5 mt-3 flex items-center gap-2 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 font-medium shrink-0">
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-5 mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 p-2.5 text-xs text-emerald-800 font-medium shrink-0">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Body */}
        <div className="p-5 flex-1 min-h-0 overflow-y-auto text-xs">
          {/* TAB 1: ROSTER */}
          {activeTab === 'ROSTER' && (
            <div className="space-y-4">
              {/* Header with Quick Add Button */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-zinc-900 text-xs">سجل طياري الفرع</h4>
                  <p className="text-[11px] text-zinc-500">
                    كافة كباتن التوصيل المسجلين على قوة فرع {branchName}
                  </p>
                </div>

                {!isAddingDriver && (
                  <button
                    type="button"
                    onClick={() => setIsAddingDriver(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 font-bold text-white shadow-2xs text-xs"
                  >
                    <Plus className="size-3.5" />
                    <span>إضافة كابتن جديد</span>
                  </button>
                )}
              </div>

              {/* Add Driver Inline Form */}
              {isAddingDriver && (
                <form
                  onSubmit={handleCreateDriver}
                  className="rounded-2xl border border-purple-200 bg-purple-50/40 p-4 space-y-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                    <span className="font-bold text-purple-950">بيانات الكابتن الجديد</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingDriver(false)}
                      className="text-zinc-500 hover:text-zinc-800 text-[11px]"
                    >
                      إلغاء
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-zinc-700 font-semibold mb-1">الاسم بالكامل:</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: أحمد عبد الله"
                        value={newDriverName}
                        onChange={(e) => setNewDriverName(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-700 font-semibold mb-1">رقم الهاتف:</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: 01012345678"
                        dir="ltr"
                        value={newDriverPhone}
                        onChange={(e) => setNewDriverPhone(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-700 font-semibold mb-1">وسيلة الانتقال:</label>
                      <select
                        value={newDriverVehicle}
                        onChange={(e) => setNewDriverVehicle(e.target.value as VehicleType)}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      >
                        <option value={VehicleType.MOTORCYCLE}>دراجة نارية (موتوسيكل)</option>
                        <option value={VehicleType.CAR}>سيارة</option>
                        <option value={VehicleType.BICYCLE}>دراجة هوائية (عجلة)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-zinc-700 font-semibold mb-1">رقم اللوحة (اختياري):</label>
                      <input
                        type="text"
                        placeholder="مثال: أ ب ج 123"
                        value={newDriverPlate}
                        onChange={(e) => setNewDriverPlate(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="rounded-xl bg-purple-700 hover:bg-purple-800 px-4 py-2 font-bold text-white shadow-xs transition disabled:opacity-50"
                    >
                      {isPending ? 'جارٍ الحفظ...' : 'حفظ وإضافة الطيار'}
                    </button>
                  </div>
                </form>
              )}

              {/* Drivers Cards Grid */}
              {isLoading ? (
                <div className="py-12 text-center text-zinc-400">
                  <Clock className="size-6 mx-auto mb-1 animate-spin text-zinc-400" />
                  <p>جارٍ تحميل الطيارين...</p>
                </div>
              ) : drivers.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 rounded-2xl border border-dashed border-zinc-200">
                  <Bike className="size-8 mx-auto mb-2 text-zinc-300" strokeWidth={1.5} />
                  <p className="font-bold text-zinc-700">لا يوجد طيارين مسجلين في هذا الفرع بعد</p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    أضف كباتن التوصيل للبدء في إسناد وتوزيع طلبات الدليفري.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {drivers.map((d) => {
                    const isAvailable = d.isActive && d.status === DriverStatus.AVAILABLE;
                    const isOnDelivery = d.status === DriverStatus.ON_DELIVERY;

                    return (
                      <div
                        key={d.id}
                        className="rounded-xl border border-zinc-200 bg-white p-3.5 space-y-2.5 shadow-2xs hover:border-zinc-300 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="grid size-9 place-items-center rounded-xl bg-zinc-100">
                              {getVehicleIcon(d.vehicleType)}
                            </div>
                            <div>
                              <h5 className="font-bold text-zinc-900 text-xs">{d.fullName}</h5>
                              <span className="text-[11px] text-zinc-500 font-mono" dir="ltr">
                                {d.phone}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              isAvailable
                                ? 'bg-emerald-100 text-emerald-800'
                                : isOnDelivery
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-zinc-100 text-zinc-600'
                            }`}
                          >
                            {isAvailable ? 'متاح بالفرع' : isOnDelivery ? 'في مشوار' : 'غير نشط'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-zinc-600 pt-1 border-t border-zinc-100">
                          <span>طلبات في الطريق: <strong>{d.activeOrdersCount}</strong></span>
                          {d.pendingCashMinor > 0 && (
                            <span className="text-amber-700 font-bold">
                              عهدة معلقة: {(d.pendingCashMinor / 100).toFixed(2)} {currencySymbol}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SETTLEMENTS */}
          {activeTab === 'SETTLEMENTS' && (
            <div className="space-y-4">
              {!reviewingDriverId ? (
                <>
                  <div>
                    <h4 className="font-bold text-zinc-900 text-xs">تسوية عهد طياري التوصيل</h4>
                    <p className="text-[11px] text-zinc-500">
                      قائمة الكباتن الذين قاموا بتسليم طلبات دفع عند الاستلام (COD) ويحملون مبالغ نقدية معلقة
                    </p>
                  </div>

                  {pendingSettlementDrivers.length === 0 ? (
                    <div className="py-12 text-center text-zinc-400 rounded-2xl border border-dashed border-zinc-200">
                      <CheckCircle2 className="size-8 mx-auto mb-2 text-emerald-500" strokeWidth={1.5} />
                      <p className="font-bold text-zinc-800">كافة عهد الطيارين مسوّاة بالكامل</p>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        لا توجد أي مبالغ نقدية معلقة بذمة أي طيار حالياً.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingSettlementDrivers.map((d) => (
                        <div
                          key={d.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-2xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="grid size-10 place-items-center rounded-xl bg-amber-100 text-amber-800">
                              <Banknote className="size-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="font-bold text-zinc-900 text-xs">{d.fullName}</h5>
                                <span className="font-mono text-[11px] text-zinc-500" dir="ltr">
                                  ({d.phone})
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-600 mt-0.5">
                                سلّم {d.unsettledDeliveredCount} طلبات بانتظار توريد النقدية
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3">
                            <div className="text-left font-mono" dir="ltr">
                              <span className="text-sm font-bold text-amber-900">
                                {(d.pendingCashMinor / 100).toFixed(2)} {currencySymbol}
                              </span>
                              <span className="block text-[10px] text-zinc-500">مطلوب توريده</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenSettleReview(d.id)}
                              className="rounded-xl bg-amber-700 hover:bg-amber-800 px-3.5 py-2 font-bold text-white shadow-2xs text-xs active:scale-95 transition"
                            >
                              استعراض وتوريد العهدة
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Settlement Confirmation Panel */
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setReviewingDriverId(null);
                        setSettlementDetails(null);
                      }}
                      className="flex items-center gap-1 text-zinc-600 hover:text-zinc-900 text-xs font-semibold"
                    >
                      <ChevronLeft className="size-4 rotate-180" />
                      <span>رجوع لقائمة العهد</span>
                    </button>

                    <span className="font-bold text-zinc-900 text-xs">
                      مراجعة وتوريد عهدة: {settlementDetails?.driver.fullName}
                    </span>
                  </div>

                  {!settlementDetails ? (
                    <div className="py-12 text-center text-zinc-400">
                      <Clock className="size-6 mx-auto mb-1 animate-spin text-zinc-400" />
                      <p>جارٍ تجهيز كشف حساب الطيار...</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {/* Shift link alert */}
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 flex items-center justify-between text-emerald-900">
                        <div>
                          <span className="font-bold block">التوريد لوردية الكاشير النشطة:</span>
                          <span className="text-[11px] text-emerald-700">
                            {settlementDetails.activeShift
                              ? `سيتم توريد المبلغ لوردية الكاشير (${settlementDetails.activeShift.cashierName}) مباشرة`
                              : 'تنبيه: لا توجد وردية كاشير نشطة حالياً بالفرع، سيتم تسجيل السند بدون قيد وردية'}
                          </span>
                        </div>
                        <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
                      </div>

                      {/* Orders Breakdown */}
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 space-y-2">
                        <p className="font-bold text-zinc-800">الطلبات المسلّمة بالكشف ({settlementDetails.orders.length} طلبات):</p>
                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-0.5">
                          {settlementDetails.orders.map((o) => (
                            <div
                              key={o.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-white border border-zinc-100 text-xs"
                            >
                              <div>
                                <span className="font-mono font-bold text-zinc-900" dir="ltr">
                                  {o.orderNumber}
                                </span>
                                <span className="text-zinc-500 mr-2">· {o.customerName || 'عميل'}</span>
                              </div>
                              <div className="text-left font-mono" dir="ltr">
                                <span className="font-bold text-zinc-950">
                                  {(o.totalMinor / 100).toFixed(2)} {currencySymbol}
                                </span>
                                <span className="text-[10px] text-zinc-500 block">
                                  {o.paymentMethod === 'CASH' ? 'دفع عند الاستلام' : 'بطاقة'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Totals Summary */}
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 space-y-1.5">
                        <div className="flex justify-between text-zinc-600">
                          <span>إجمالي الطلبات:</span>
                          <span>{settlementDetails.summary.totalOrdersCount} طلبات</span>
                        </div>
                        <div className="flex justify-between text-zinc-600">
                          <span>طلبات الدفع عند الاستلام (COD):</span>
                          <span>{settlementDetails.summary.codOrdersCount} طلبات</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-zinc-200 font-bold text-sm text-zinc-900">
                          <span>المبلغ النقدي الواجب توريده بالدرج:</span>
                          <span className="font-mono text-base text-emerald-700">
                            {(settlementDetails.summary.totalCollectedCashMinor / 100).toFixed(2)} {currencySymbol}
                          </span>
                        </div>
                      </div>

                      {/* Notes input */}
                      <div>
                        <label className="block text-zinc-700 font-semibold mb-1">ملاحظات التسوية (اختياري):</label>
                        <input
                          type="text"
                          placeholder="مثال: توريد نهاية وردية الغداء"
                          value={settlementNotes}
                          onChange={(e) => setSettlementNotes(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                        />
                      </div>

                      {/* Confirmation Buttons */}
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setReviewingDriverId(null)}
                          className="rounded-xl border border-zinc-200 px-4 py-2 font-medium text-zinc-600 hover:bg-zinc-100"
                        >
                          إلغاء
                        </button>

                        <button
                          type="button"
                          onClick={handleConfirmSettlement}
                          disabled={isPending}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 font-bold text-white shadow-xs transition disabled:opacity-50"
                        >
                          <Printer className="size-3.5" />
                          <span>{isPending ? 'جارٍ التوريد...' : 'تأكيد التوريد وإيداع النقدية بالدرج'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
