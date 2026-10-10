'use client';

import React from 'react';
import { Volume2, VolumeX, Bike, RefreshCw } from 'lucide-react';

interface OrdersHeaderProps {
  pendingCount: number;
  isMuted: boolean;
  toggleSound: () => void;
  autoRefreshEnabled: boolean;
  setAutoRefreshEnabled: (enabled: boolean) => void;
  activeFleetBranchId: string | null;
  onOpenFleetModal: () => void;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function OrdersHeader({
  pendingCount,
  isMuted,
  toggleSound,
  autoRefreshEnabled,
  setAutoRefreshEnabled,
  activeFleetBranchId,
  onOpenFleetModal,
  isRefreshing,
  onRefresh,
}: OrdersHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
            مركز إدارة الطلبات الإلكترونية
          </h1>
          {pendingCount > 0 && (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">
          قمرة القيادة الحية لمتابعة تدفق طلبات التوصيل وإسنادها للفروع لحظة بلحظة.
        </p>
      </div>

      {/* Live Controls */}
      <div className="flex items-center gap-2">
        {/* Sound Toggle */}
        <button
          type="button"
          onClick={toggleSound}
          className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
            isMuted
              ? 'border-zinc-200 text-zinc-400 bg-zinc-50 hover:bg-zinc-100'
              : 'border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100'
          }`}
          title={isMuted ? 'تفعيل التنبيه الصوتي عند وصول طلب جديد' : 'كتم التنبيه الصوتي'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span className="hidden md:inline">{isMuted ? 'صامت' : 'التنبيه نشط'}</span>
        </button>

        {/* Auto Refresh Toggle */}
        <button
          type="button"
          onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
            autoRefreshEnabled
              ? 'border-emerald-200 text-emerald-800 bg-emerald-50'
              : 'border-zinc-200 text-zinc-500 bg-zinc-50'
          }`}
        >
          {autoRefreshEnabled ? 'تحديث تلقائي (20ث)' : 'التحديث معطل'}
        </button>

        {/* Fleet Management Button */}
        {activeFleetBranchId && (
          <button
            type="button"
            onClick={onOpenFleetModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition shadow-2xs"
            title="إدارة أسطول الكباتن وإقفال العهدة النقدية"
          >
            <Bike className="w-4 h-4 text-purple-600" />
            <span className="hidden md:inline">أسطول التوصيل والطيارين</span>
          </button>
        )}

        {/* Manual Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 transition disabled:opacity-50"
          title="تحديث البيانات فوراً"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-zinc-900' : ''}`} />
          <span>تحديث</span>
        </button>
      </div>
    </div>
  );
}
