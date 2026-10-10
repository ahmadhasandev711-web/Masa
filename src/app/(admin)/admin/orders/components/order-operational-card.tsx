'use client';

import React from 'react';
import {
  Clock,
  Phone,
  MapPin,
  Building2,
  AlertCircle,
  Bike,
  Eye,
} from 'lucide-react';
import { OrderStatus, PaymentMethod } from '../../../../../domain/ordering/enums';
import { DetailedOrder } from '../order-detail-modal';

interface OrderOperationalCardProps {
  order: DetailedOrder;
  currencySymbol: string;
  formatMoney: (minor: number) => string;
  formatTimeAgo: (date: Date | string) => string;
  getStatusBadge: (status: string) => { label: string; cls: string };
  onUpdateStatus: (orderId: string, nextStatus: OrderStatus) => void;
  onViewDetails: (order: DetailedOrder) => void;
  onStartDispatch: (order: DetailedOrder) => void;
}

export function OrderOperationalCard({
  order,
  currencySymbol,
  formatMoney,
  formatTimeAgo,
  getStatusBadge,
  onUpdateStatus,
  onViewDetails,
  onStartDispatch,
}: OrderOperationalCardProps) {
  const badge = getStatusBadge(order.status);
  const isUnassigned = !order.branchId;

  return (
    <div className="bg-white rounded-xl border border-zinc-200 hover:border-zinc-300 transition shadow-xs flex flex-col justify-between overflow-hidden">
      {/* Card Header */}
      <div className="p-4 border-b border-zinc-100 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm font-bold text-zinc-950">
            {order.orderNumber}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badge.cls}`}>
            {badge.label}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-500">
          <span className="flex items-center gap-1 font-medium">
            <Clock className="w-3 h-3 text-zinc-400" />
            {formatTimeAgo(order.createdAt)}
          </span>
          <span>{order.paymentMethod === PaymentMethod.CASH ? 'دفع عند الاستلام' : order.paymentMethod}</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-3 flex-1 text-xs">
        {/* Customer Info */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-900">{order.customerName}</span>
            <a
              href={`tel:${order.customerPhone}`}
              className="text-zinc-600 hover:text-emerald-700 font-mono text-[11px] flex items-center gap-1"
              dir="ltr"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="w-3 h-3 text-zinc-400" />
              <span>{order.customerPhone}</span>
            </a>
          </div>
          {order.deliveryAddress && (
            <div className="flex items-start gap-1 text-zinc-600 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
              <span className="line-clamp-1">{order.deliveryAddress}</span>
            </div>
          )}
        </div>

        {/* Branch Assignment Status */}
        <div className="pt-1 flex flex-wrap items-center gap-1.5">
          {order.branch ? (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-50 border border-zinc-200 text-zinc-700 text-[11px]">
              <Building2 className="w-3 h-3 text-zinc-500" />
              <span>فرع: {order.branch.nameAr}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold">
              <AlertCircle className="w-3 h-3" />
              <span>غير مسند لفرع حتى الآن!</span>
            </div>
          )}

          {order.driverName && (
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-50 border border-purple-200 text-purple-800 text-[11px] font-semibold">
              <Bike className="w-3 h-3 text-purple-600" />
              <span>كابتن: {order.driverName}</span>
            </div>
          )}
        </div>

        {/* Items Preview */}
        <div className="bg-zinc-50/60 p-2.5 rounded-lg border border-zinc-100 text-[11px] space-y-1">
          <span className="font-semibold text-zinc-700 block">
            الأصناف ({order.items.reduce((s, i) => s + i.quantity, 0)} قطع):
          </span>
          <ul className="text-zinc-600 space-y-0.5">
            {order.items.slice(0, 2).map((item) => (
              <li key={item.id} className="truncate">
                • {item.productNameAr} {item.sizeNameAr && `(${item.sizeNameAr})`} × {item.quantity}
              </li>
            ))}
            {order.items.length > 2 && (
              <li className="text-[10px] text-zinc-400 font-medium">
                + {order.items.length - 2} أصناف أخرى...
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Card Footer (Price & Quick Actions) */}
      <div className="p-3 bg-zinc-50/60 border-t border-zinc-100 flex items-center justify-between gap-2">
        <div className="text-left">
          <span className="text-[10px] text-zinc-400 block">الإجمالي:</span>
          <span className="text-sm font-bold text-zinc-950">
            {formatMoney(order.totalMinor)} {currencySymbol}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Primary Status Step Button */}
          {order.status === OrderStatus.PENDING && (
            <button
              type="button"
              onClick={() => onUpdateStatus(order.id, OrderStatus.CONFIRMED)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition"
            >
              تأكيد
            </button>
          )}

          {order.status === OrderStatus.CONFIRMED && (
            <button
              type="button"
              onClick={() => {
                if (isUnassigned) {
                  onViewDetails(order);
                } else {
                  onUpdateStatus(order.id, OrderStatus.PREPARING);
                }
              }}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg text-white transition ${
                isUnassigned
                  ? 'bg-zinc-800 hover:bg-zinc-900'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {isUnassigned ? 'إسناد فرع' : 'تجهيز بالمطبخ'}
            </button>
          )}

          {order.status === OrderStatus.PREPARING && (
            <button
              type="button"
              onClick={() => onUpdateStatus(order.id, OrderStatus.READY_FOR_PICKUP)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
            >
              جاهز للتوصيل
            </button>
          )}

          {order.status === OrderStatus.READY_FOR_PICKUP && (
            <button
              type="button"
              onClick={() => {
                if (!order.branchId) {
                  onViewDetails(order);
                } else {
                  onStartDispatch(order);
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
            >
              <Bike className="w-3.5 h-3.5" />
              <span>مع المندوب</span>
            </button>
          )}

          {order.status === OrderStatus.OUT_FOR_DELIVERY && (
            <button
              type="button"
              onClick={() => onUpdateStatus(order.id, OrderStatus.DELIVERED)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
            >
              تم التسليم
            </button>
          )}

          {/* View Details Button */}
          <button
            type="button"
            onClick={() => onViewDetails(order)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 transition"
          >
            <Eye className="w-3.5 h-3.5 text-zinc-500" />
            <span>تفاصيل</span>
          </button>
        </div>
      </div>
    </div>
  );
}
