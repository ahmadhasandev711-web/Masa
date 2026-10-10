'use client';

import React from 'react';
import { ChefHat, Truck, CheckCheck, DollarSign } from 'lucide-react';
import { OrderStatus } from '../../../../../domain/ordering/enums';

export interface OrderMetrics {
  pendingCount: number;
  preparingCount: number;
  inDeliveryCount: number;
  deliveredTodayCount: number;
  todaySalesMinor: number;
}

interface OrdersKpiSummaryProps {
  metrics: OrderMetrics;
  selectedStatus: string;
  onFilterChange: (status: OrderStatus) => void;
  currencySymbol: string;
  formatMoney: (minor: number) => string;
}

export function OrdersKpiSummary({
  metrics,
  selectedStatus,
  onFilterChange,
  currencySymbol,
  formatMoney,
}: OrdersKpiSummaryProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {/* Pending Orders */}
      <div
        onClick={() => onFilterChange(OrderStatus.PENDING)}
        className={`cursor-pointer p-4 rounded-xl border transition shadow-2xs ${
          selectedStatus === OrderStatus.PENDING
            ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
            : 'border-zinc-200 bg-white hover:border-zinc-300'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
          <span>طلبات معلقة جديدة</span>
          <div
            className={`w-2 h-2 rounded-full ${
              metrics.pendingCount > 0 ? 'bg-blue-600 animate-pulse' : 'bg-zinc-300'
            }`}
          />
        </div>
        <div className="text-2xl font-bold text-zinc-900">{metrics.pendingCount}</div>
        <span className="text-[11px] text-zinc-500">تحتاج مراجعة وإسناد</span>
      </div>

      {/* Preparing */}
      <div
        onClick={() => onFilterChange(OrderStatus.PREPARING)}
        className={`cursor-pointer p-4 rounded-xl border transition shadow-2xs ${
          selectedStatus === OrderStatus.PREPARING
            ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20'
            : 'border-zinc-200 bg-white hover:border-zinc-300'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
          <span>قيد التجهيز بالمطبخ</span>
          <ChefHat className="w-3.5 h-3.5 text-orange-600" />
        </div>
        <div className="text-2xl font-bold text-zinc-900">{metrics.preparingCount}</div>
        <span className="text-[11px] text-zinc-500">في المطابخ حالياً</span>
      </div>

      {/* In Delivery */}
      <div
        onClick={() => onFilterChange(OrderStatus.OUT_FOR_DELIVERY)}
        className={`cursor-pointer p-4 rounded-xl border transition shadow-2xs ${
          selectedStatus === OrderStatus.OUT_FOR_DELIVERY
            ? 'border-purple-500 bg-purple-50/50 ring-2 ring-purple-500/20'
            : 'border-zinc-200 bg-white hover:border-zinc-300'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
          <span>مع المندوب</span>
          <Truck className="w-3.5 h-3.5 text-purple-600" />
        </div>
        <div className="text-2xl font-bold text-zinc-900">{metrics.inDeliveryCount}</div>
        <span className="text-[11px] text-zinc-500">في طريقها للزبائن</span>
      </div>

      {/* Delivered Today */}
      <div
        onClick={() => onFilterChange(OrderStatus.DELIVERED)}
        className={`cursor-pointer p-4 rounded-xl border transition shadow-2xs ${
          selectedStatus === OrderStatus.DELIVERED
            ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
            : 'border-zinc-200 bg-white hover:border-zinc-300'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
          <span>تم تسليمها اليوم</span>
          <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
        </div>
        <div className="text-2xl font-bold text-zinc-900">{metrics.deliveredTodayCount}</div>
        <span className="text-[11px] text-zinc-500">طلبات مكتملة بنجاح</span>
      </div>

      {/* Sales Today */}
      <div className="col-span-2 sm:col-span-1 p-4 rounded-xl border border-zinc-200 bg-white shadow-2xs">
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
          <span>مبيعات اليوم المحققة</span>
          <DollarSign className="w-3.5 h-3.5 text-zinc-700" />
        </div>
        <div className="text-2xl font-bold text-zinc-900">
          {formatMoney(metrics.todaySalesMinor)}
          <span className="text-xs font-normal text-zinc-500 mr-1">{currencySymbol}</span>
        </div>
        <span className="text-[11px] text-zinc-500">للطلبات المسلمة</span>
      </div>
    </div>
  );
}
