'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  X,
  Bike,
  Car,
  Truck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  User,
} from 'lucide-react';
import { VehicleType, DriverStatus } from '../../../../../domain/delivery/enums';
import { listBranchDriversAction, dispatchOrdersAction } from '../../../../actions/delivery.actions';
import { DetailedOrder } from '../order-detail-modal';
import { DriverViewItem } from '../../../../../application/delivery/use-cases/list-branch-drivers.use-case';

interface DispatchModalProps {
  order: DetailedOrder;
  currencySymbol?: string;
  onClose: () => void;
  onDispatched: (driverName: string) => void;
}

export function DispatchModal({
  order,
  currencySymbol = 'ج.م',
  onClose,
  onDispatched,
}: DispatchModalProps) {
  const [drivers, setDrivers] = useState<DriverViewItem[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadDrivers() {
      if (!order.branchId) {
        setErrorMsg('يجب إسناد الطلب لفرع أولاً قبل اختيار الطيار');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const res = await listBranchDriversAction(order.branchId);
      if (res.success) {
        setDrivers(res.data);
        // Pre-select first available driver if any
        const firstAvailable = res.data.find(
          (d) => d.isActive && d.status === DriverStatus.AVAILABLE
        );
        if (firstAvailable) {
          setSelectedDriverId(firstAvailable.id);
        }
      } else {
        setErrorMsg(res.error || 'فشل تحميل قائمة الطيارين');
      }
      setIsLoading(false);
    }

    loadDrivers();
  }, [order.branchId]);

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

  const handleConfirmDispatch = () => {
    if (!selectedDriverId || !order.branchId) return;

    const chosenDriver = drivers.find((d) => d.id === selectedDriverId);
    if (!chosenDriver) return;

    startTransition(async () => {
      setErrorMsg(null);
      const res = await dispatchOrdersAction({
        branchId: order.branchId!,
        driverId: selectedDriverId,
        orderIds: [order.id],
      });

      if (res.success) {
        onDispatched(chosenDriver.fullName);
      } else {
        setErrorMsg(res.error || 'فشل إسناد الطلب للطيار');
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in"
      dir="rtl"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 bg-zinc-50/70">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-purple-100 text-purple-700">
              <Truck className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900">
                إسناد وخروج الطلب مع طيار
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono">
                {order.orderNumber} · {order.customerName}
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

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 font-medium">
              <AlertCircle className="size-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Order Brief */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-zinc-500 block">العنوان والتسليم:</span>
              <p className="font-medium text-zinc-800 line-clamp-1">
                {order.deliveryAddress || 'عنوان محدد بالتفاصيل'}
              </p>
            </div>
            <div className="text-left font-mono" dir="ltr">
              <span className="text-xs font-bold text-zinc-950">
                {(order.totalMinor / 100).toFixed(2)} {currencySymbol}
              </span>
              <span className="block text-[10px] text-zinc-500">
                {order.paymentMethod === 'CASH' ? 'دفع عند الاستلام' : 'مدفوع إلكترونياً'}
              </span>
            </div>
          </div>

          {/* Drivers List */}
          <div>
            <label className="block font-bold text-zinc-800 mb-2">
              اختر كابتن التوصيل بالفرع ({drivers.length} طيار):
            </label>

            {isLoading ? (
              <div className="py-8 text-center text-zinc-400">
                <Clock className="size-5 mx-auto mb-1 animate-spin text-zinc-400" />
                <p>جارٍ تحميل طياري الفرع...</p>
              </div>
            ) : drivers.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 rounded-xl border border-dashed border-zinc-200">
                <User className="size-6 mx-auto mb-1 text-zinc-300" />
                <p className="font-semibold text-zinc-700">لا يوجد طيارين مسجلين بهذا الفرع</p>
                <p className="text-[11px] mt-0.5 text-zinc-400">
                  يرجى إضافة طيارين للفرع من زر إدارة الأسطول أولاً.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                {drivers.map((d) => {
                  const isSelected = selectedDriverId === d.id;
                  const isAvailable = d.isActive && d.status === DriverStatus.AVAILABLE;
                  const isOnDelivery = d.status === DriverStatus.ON_DELIVERY;

                  return (
                    <div
                      key={d.id}
                      onClick={() => {
                        if (d.isActive) setSelectedDriverId(d.id);
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer select-none ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-600/20'
                          : 'border-zinc-200 bg-white hover:border-zinc-300'
                      } ${!d.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid size-9 place-items-center rounded-xl bg-zinc-100">
                          {getVehicleIcon(d.vehicleType)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-900 text-xs">
                              {d.fullName}
                            </span>
                            {d.licensePlate && (
                              <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-mono">
                                {d.licensePlate}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500">
                            <span className="flex items-center gap-1 font-mono" dir="ltr">
                              <Phone className="size-3 text-zinc-400" />
                              {d.phone}
                            </span>
                            {d.activeOrdersCount > 0 && (
                              <span className="text-purple-700 font-semibold">
                                · معه {d.activeOrdersCount} طلبات بالشارع
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            isAvailable
                              ? 'bg-emerald-100 text-emerald-800'
                              : isOnDelivery
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {isAvailable ? 'متاح بالفرع' : isOnDelivery ? 'في مشوار' : 'غير متاح'}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="size-4 text-purple-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-5 py-3.5 bg-zinc-50/50 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-4 py-2 font-medium text-zinc-600 hover:bg-zinc-100"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleConfirmDispatch}
            disabled={!selectedDriverId || isPending || drivers.length === 0}
            className="flex items-center gap-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 px-4 py-2 font-bold text-white shadow-xs transition disabled:opacity-50"
          >
            <Truck className="size-3.5" />
            <span>{isPending ? 'جارٍ الإسناد...' : 'تأكيد الخروج مع المندوب'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
