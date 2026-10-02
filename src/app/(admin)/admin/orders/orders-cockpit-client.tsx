'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShoppingBag,
  Clock,
  Building2,
  Phone,
  MapPin,
  RefreshCw,
  Search,
  Volume2,
  VolumeX,
  AlertCircle,
  ChefHat,
  Truck,
  CheckCheck,
  Eye,
  DollarSign,
  Bike,
  Calendar,
} from 'lucide-react';
import { OrderStatus, PaymentMethod } from '../../../../domain/ordering/enums';
import {
  listOrdersAction,
  getOrdersMetricsAction,
  assignOrderBranchAction,
  updateOrderStatusAction,
} from '../../../actions/order.actions';
import { OrderDetailModal, DetailedOrder, BranchOption } from './order-detail-modal';
import { ThermalReceipt } from './thermal-receipt';
import { DispatchModal } from './components/dispatch-modal';
import { FleetManagementModal } from './components/fleet-management-modal';
import { DriverSettlementReceipt, DriverSettlementPrintData } from './components/driver-settlement-receipt';
import { KitchenOrderTicketPrint, KitchenTicketData } from '../../../../components/printing/kitchen-order-ticket';

interface OrdersCockpitClientProps {
  initialOrders: DetailedOrder[];
  initialMetrics: {
    pendingCount: number;
    preparingCount: number;
    inDeliveryCount: number;
    deliveredTodayCount: number;
    todaySalesMinor: number;
  };
  branches: BranchOption[];
  currencySymbol?: string;
  restaurantNameAr?: string;
  restaurantNameEn?: string;
  isBranchRestricted?: boolean;
  userBranchId?: string | null;
  canAssignBranch?: boolean;
  initialDateStr?: string;
}

export function OrdersCockpitClient({
  initialOrders,
  initialMetrics,
  branches,
  currencySymbol = 'ج.م',
  restaurantNameAr = 'مطعم ماسا',
  restaurantNameEn = 'MASA Kitchen',
  isBranchRestricted = false,
  userBranchId = null,
  canAssignBranch = true,
  initialDateStr,
}: OrdersCockpitClientProps) {
  const [orders, setOrders] = useState<DetailedOrder[]>(initialOrders);
  const [metrics, setMetrics] = useState(initialMetrics);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    isBranchRestricted && userBranchId ? userBranchId : 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Date Filter States
  type DatePreset = 'today' | 'week' | 'month' | 'custom';
  const defaultDate = initialDateStr ?? new Date().toISOString().slice(0, 10);
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [startDateStr, setStartDateStr] = useState<string>(defaultDate);
  const [endDateStr, setEndDateStr] = useState<string>(defaultDate);

  const getPresetDates = (preset: DatePreset) => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    if (preset === 'today') {
      return { start: today, end: today };
    }
    if (preset === 'week') {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      return { start: d.toISOString().slice(0, 10), end: today };
    }
    if (preset === 'month') {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      return { start: d.toISOString().slice(0, 10), end: today };
    }
    return { start: startDateStr, end: endDateStr };
  };

  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset !== 'custom') {
      const { start, end } = getPresetDates(preset);
      setStartDateStr(start);
      setEndDateStr(end);
    }
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setDatePreset('custom');
    setStartDateStr(start);
    setEndDateStr(end);
  };

  // Audio & polling states
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('resto_sound_muted') === 'true';
    }
    return false;
  });
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);

  // Modal & Print states
  const [activeModalOrder, setActiveModalOrder] = useState<DetailedOrder | null>(null);
  const [printingOrder, setPrintingOrder] = useState<DetailedOrder | null>(null);
  const [printingKot, setPrintingKot] = useState<KitchenTicketData | null>(null);

  // Delivery Dispatch & Fleet states
  const [dispatchingOrder, setDispatchingOrder] = useState<DetailedOrder | null>(null);
  const [isFleetModalOpen, setIsFleetModalOpen] = useState<boolean>(false);
  const [printedSettlement, setPrintedSettlement] = useState<DriverSettlementPrintData | null>(null);

  const activeFleetBranchId =
    isBranchRestricted && userBranchId
      ? userBranchId
      : selectedBranchId !== 'ALL' && selectedBranchId !== 'UNASSIGNED'
      ? selectedBranchId
      : branches[0]?.id || '';

  const prevPendingCountRef = useRef<number>(initialMetrics.pendingCount);

  // Audio Alert synthesizer using Web Audio API
  const playAlertSound = useCallback(() => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5 note

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio playback might be restricted before user interaction
    }
  }, [isMuted]);

  const toggleSound = () => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem('resto_sound_muted', String(next));
      return next;
    });
  };

  // Fetch data
  const fetchData = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setIsRefreshing(true);
      const effectiveBranchId = isBranchRestricted && userBranchId ? userBranchId : selectedBranchId;
      try {
        const [ordersRes, metricsRes] = await Promise.all([
          listOrdersAction({
            status: selectedStatus,
            branchId: effectiveBranchId,
            search: searchQuery,
            dateFrom: startDateStr ? `${startDateStr}T00:00:00.000Z` : undefined,
            dateTo: endDateStr ? `${endDateStr}T23:59:59.999Z` : undefined,
            limit: 50,
          }),
          getOrdersMetricsAction(effectiveBranchId),
        ]);

        if (ordersRes.success && ordersRes.data) {
          const fetchedOrders = ordersRes.data.orders as unknown as DetailedOrder[];
          setOrders(fetchedOrders);

          // Update active modal order if open
          if (activeModalOrder) {
            const updatedActive = fetchedOrders.find((o) => o.id === activeModalOrder.id);
            if (updatedActive) setActiveModalOrder(updatedActive);
          }
        }

        if (metricsRes.success && metricsRes.data) {
          const newMetrics = metricsRes.data;
          // Trigger audio if pending count increased
          if (newMetrics.pendingCount > prevPendingCountRef.current) {
            playAlertSound();
          }
          prevPendingCountRef.current = newMetrics.pendingCount;
          setMetrics(newMetrics);
        }
      } catch (error) {
        console.error('Failed to refresh orders cockpit:', error);
      } finally {
        if (!isBackground) setIsRefreshing(false);
      }
    },
    [selectedStatus, selectedBranchId, searchQuery, startDateStr, endDateStr, activeModalOrder, playAlertSound, isBranchRestricted, userBranchId]
  );

  // Auto-refresh interval (every 20 seconds)
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      fetchData(true);
    }, 20000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, fetchData]);

  // Handle manual filter change
  const handleFilterChange = (status: string) => {
    setSelectedStatus(status);
  };

  // Trigger search on submit or debounce (skipping duplicate initial mount fetch)
  const isFirstMountRef = useRef<boolean>(true);
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      fetchData(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedStatus, selectedBranchId, searchQuery, startDateStr, endDateStr, fetchData]);

  // Branch assignment action
  const handleAssignBranch = async (orderId: string, branchId: string): Promise<boolean> => {
    const res = await assignOrderBranchAction({ orderId, branchId });
    if (res.success) {
      await fetchData(false);
      return true;
    }
    return false;
  };

  // Status transition action
  const handleUpdateStatus = async (
    orderId: string,
    nextStatus: OrderStatus,
    cancelReason?: string
  ): Promise<boolean> => {
    const res = await updateOrderStatusAction({ orderId, nextStatus, cancelReason });
    if (res.success) {
      await fetchData(false);
      return true;
    }
    return false;
  };

  // Print thermal receipt
  const handlePrint = (order: DetailedOrder) => {
    setPrintingKot(null);
    setPrintedSettlement(null);
    setPrintingOrder(order);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Print Kitchen Order Ticket (KOT)
  const handlePrintKot = (order: DetailedOrder) => {
    setPrintingOrder(null);
    setPrintedSettlement(null);
    setPrintingKot({
      orderNumber: order.orderNumber,
      type: order.type,
      tableName: null,
      sectionName: null,
      guestCount: null,
      customerName: order.customerName,
      customerNotes: order.customerNotes,
      kitchenNotes: null,
      createdAt: order.createdAt,
      branchName: order.branch?.nameAr ?? null,
      cashierName: null,
      items: order.items.map((item) => ({
        id: item.id,
        productNameAr: item.productNameAr,
        productNameEn: item.productNameEn,
        sizeNameAr: item.sizeNameAr,
        quantity: item.quantity,
        modifiers: item.modifiers.map((m) => ({ nameAr: m.nameAr })),
      })),
    });
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Helper for formatting time ago
  const formatTimeAgo = (dateInput: Date | string) => {
    const now = new Date().getTime();
    const created = new Date(dateInput).getTime();
    const diffMins = Math.max(0, Math.floor((now - created) / 60000));
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `منذ ${diffHours} س`;
    const d = new Date(dateInput);
    return `${d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })} ${d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const formatMoney = (minor: number) => (minor / 100).toFixed(2);
  const ordersTotalMinor = orders.reduce((sum, o) => sum + (o.totalMinor ?? 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case OrderStatus.PENDING:
        return { label: 'جديد قيد المراجعة', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
      case OrderStatus.CONFIRMED:
        return { label: 'تم التأكيد', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
      case OrderStatus.PREPARING:
        return { label: 'جاري التجهيز', cls: 'bg-orange-50 text-orange-700 border-orange-200' };
      case OrderStatus.READY_FOR_PICKUP:
        return { label: 'جاهز للتوصيل', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case OrderStatus.OUT_FOR_DELIVERY:
        return { label: 'مع المندوب', cls: 'bg-purple-50 text-purple-700 border-purple-200' };
      case OrderStatus.DELIVERED:
        return { label: 'تم التسليم', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case OrderStatus.CANCELLED:
        return { label: 'ملغي', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
      case OrderStatus.REJECTED:
        return { label: 'مرفوض', cls: 'bg-zinc-100 text-zinc-700 border-zinc-200' };
      default:
        return { label: status, cls: 'bg-zinc-100 text-zinc-700 border-zinc-200' };
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
              مركز إدارة الطلبات الإلكترونية
            </h1>
            {metrics.pendingCount > 0 && (
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
              onClick={() => setIsFleetModalOpen(true)}
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
            onClick={() => fetchData(false)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 transition disabled:opacity-50"
            title="تحديث البيانات فوراً"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-zinc-900' : ''}`} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* 2. Top KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Pending Orders */}
        <div
          onClick={() => handleFilterChange(OrderStatus.PENDING)}
          className={`cursor-pointer p-4 rounded-xl border transition shadow-2xs ${
            selectedStatus === OrderStatus.PENDING
              ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
              : 'border-zinc-200 bg-white hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
            <span>طلبات معلقة جديدة</span>
            <div className={`w-2 h-2 rounded-full ${metrics.pendingCount > 0 ? 'bg-blue-600 animate-pulse' : 'bg-zinc-300'}`} />
          </div>
          <div className="text-2xl font-bold text-zinc-900">{metrics.pendingCount}</div>
          <span className="text-[11px] text-zinc-500">تحتاج مراجعة وإسناد</span>
        </div>

        {/* Preparing */}
        <div
          onClick={() => handleFilterChange(OrderStatus.PREPARING)}
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
          onClick={() => handleFilterChange(OrderStatus.OUT_FOR_DELIVERY)}
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
          onClick={() => handleFilterChange(OrderStatus.DELIVERED)}
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

      {/* 3. Filters & Date Navigation */}
      <div className="space-y-3">
        {/* Date Filter Bar */}
        <div className="rounded-xl border border-zinc-200 bg-white p-3 sm:p-4 shadow-2xs">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5 ml-1">
                <Calendar className="h-4 w-4 text-zinc-400" />
                <span>الفترة:</span>
              </span>
              <button
                type="button"
                onClick={() => handlePresetChange('today')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  datePreset === 'today'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                اليوم
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange('week')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  datePreset === 'week'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                آخر 7 أيام
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange('month')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  datePreset === 'month'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                هذا الشهر
              </button>
            </div>

            {/* Date inputs (من / إلى) & Active Filter Summary */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5">
                <label htmlFor="orders-start-date" className="text-xs text-zinc-500 font-medium">من:</label>
                <input
                  id="orders-start-date"
                  type="date"
                  value={startDateStr}
                  onChange={(e) => handleCustomDateChange(e.target.value, endDateStr)}
                  className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-800 bg-white focus:border-zinc-900 focus:outline-hidden"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <label htmlFor="orders-end-date" className="text-xs text-zinc-500 font-medium">إلى:</label>
                <input
                  id="orders-end-date"
                  type="date"
                  value={endDateStr}
                  onChange={(e) => handleCustomDateChange(startDateStr, e.target.value)}
                  className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-800 bg-white focus:border-zinc-900 focus:outline-hidden"
                />
              </div>

              {/* Volume summary badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200/80 text-xs">
                <span className="text-zinc-500">الطلبات:</span>
                <span className="font-bold text-zinc-900">{orders.length}</span>
                <span className="text-zinc-300">|</span>
                <span className="text-zinc-500">القيمة:</span>
                <span className="font-bold text-zinc-900 font-mono">
                  {formatMoney(ordersTotalMinor)} {currencySymbol}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-zinc-200 text-xs">
          {[
            { id: 'ALL', label: 'جميع الطلبات' },
            { id: OrderStatus.PENDING, label: 'جديدة قيد المراجعة', badge: metrics.pendingCount },
            { id: OrderStatus.CONFIRMED, label: 'مؤكدة' },
            { id: OrderStatus.PREPARING, label: 'جاري التجهيز' },
            { id: OrderStatus.READY_FOR_PICKUP, label: 'جاهزة للتوصيل' },
            { id: OrderStatus.OUT_FOR_DELIVERY, label: 'مع المندوب' },
            { id: OrderStatus.DELIVERED, label: 'تم التسليم' },
            { id: OrderStatus.CANCELLED, label: 'ملغاة / مرفوضة' },
          ].map((tab) => {
            const isActive = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 font-semibold rounded-lg transition ${
                  isActive
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white text-zinc-900' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Branch Select row */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث برقم الطلب، هاتف العميل، أو الاسم..."
              className="w-full text-xs pr-9 pl-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-white"
            />
          </div>

          {/* Branch Filter: Locked Badge for branch staff, Dropdown for central management */}
          {isBranchRestricted ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-xs text-zinc-700 w-full sm:w-auto">
              <Building2 className="w-4 h-4 text-zinc-500 shrink-0" />
              <span className="text-zinc-500">نطاق فرعك:</span>
              <span className="font-semibold text-zinc-900">
                {branches.find((b) => b.id === userBranchId)?.nameAr ?? 'الفرع المحدد'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Building2 className="w-4 h-4 text-zinc-400 shrink-0 hidden sm:block" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full sm:w-48 text-xs border border-zinc-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="ALL">جميع الفروع</option>
                <option value="UNASSIGNED">طلبات غير مسندة لفرع</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    فرع {b.nameAr}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 4. Operational Cards Grid */}
      {orders.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-zinc-200 rounded-2xl bg-white space-y-2">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-zinc-800">لا توجد طلبات مطابقة</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            لا توجد أي طلبات تتطابق مع الفلتر الحالي أو معايير البحث المحددة.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map((order) => {
            const badge = getStatusBadge(order.status);
            const isUnassigned = !order.branchId;

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-zinc-200 hover:border-zinc-300 transition shadow-xs flex flex-col justify-between overflow-hidden"
              >
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
                        onClick={() => handleUpdateStatus(order.id, OrderStatus.CONFIRMED)}
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
                            setActiveModalOrder(order);
                          } else {
                            handleUpdateStatus(order.id, OrderStatus.PREPARING);
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
                        onClick={() => handleUpdateStatus(order.id, OrderStatus.READY_FOR_PICKUP)}
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
                            setActiveModalOrder(order);
                          } else {
                            setDispatchingOrder(order);
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
                        onClick={() => handleUpdateStatus(order.id, OrderStatus.DELIVERED)}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
                      >
                        تم التسليم
                      </button>
                    )}

                    {/* View Details / Modal Trigger */}
                    <button
                      type="button"
                      onClick={() => setActiveModalOrder(order)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-zinc-500" />
                      <span>تفاصيل</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Detail Modal */}
      {activeModalOrder && (
        <OrderDetailModal
          order={activeModalOrder}
          branches={branches}
          currencySymbol={currencySymbol}
          canAssignBranch={canAssignBranch}
          onClose={() => setActiveModalOrder(null)}
          onAssignBranch={handleAssignBranch}
          onUpdateStatus={handleUpdateStatus}
          onPrint={() => handlePrint(activeModalOrder)}
          onPrintKot={() => handlePrintKot(activeModalOrder)}
          onStartDispatch={(order) => {
            setActiveModalOrder(null);
            setDispatchingOrder(order);
          }}
        />
      )}

      {/* 6. Printable Thermal Receipt (Hidden on screen, rendered on window.print()) */}
      {printingOrder && (
        <ThermalReceipt
          order={printingOrder}
          restaurantNameAr={restaurantNameAr}
          restaurantNameEn={restaurantNameEn}
          currencySymbol={currencySymbol}
        />
      )}

      {/* 6.1 Printable Kitchen Order Ticket (KOT) */}
      {printingKot && (
        <KitchenOrderTicketPrint
          ticket={printingKot}
          restaurantName={restaurantNameAr}
        />
      )}

      {/* 7. Dispatch Modal */}
      {dispatchingOrder && dispatchingOrder.branchId && (
        <DispatchModal
          order={dispatchingOrder}
          currencySymbol={currencySymbol}
          onClose={() => setDispatchingOrder(null)}
          onDispatched={() => {
            setDispatchingOrder(null);
            fetchData(false);
          }}
        />
      )}

      {/* 8. Fleet Management Modal */}
      {isFleetModalOpen && activeFleetBranchId && (
        <FleetManagementModal
          branchId={activeFleetBranchId}
          branchName={branches.find((b) => b.id === activeFleetBranchId)?.nameAr}
          currencySymbol={currencySymbol}
          onClose={() => setIsFleetModalOpen(false)}
          onSettlementCompleted={(settlementData) => {
            setPrintedSettlement(settlementData);
            fetchData(false);
          }}
        />
      )}

      {/* 9. Driver Settlement Printable Receipt */}
      {printedSettlement && (
        <DriverSettlementReceipt
          data={printedSettlement}
          restaurantName={restaurantNameAr}
          currencySymbol={currencySymbol}
          onAfterPrint={() => setPrintedSettlement(null)}
        />
      )}
    </div>
  );
}
