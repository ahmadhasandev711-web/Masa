'use client';

import React, { useState, useEffect, useCallback, useRef, useTransition } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ChefHat,
  Clock,
  Check,
  CheckCheck,
  RefreshCw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Printer,
  Utensils,
  Store,
  Bike,
  AlertTriangle,
  Play,
  Pause,
  Loader2,
} from 'lucide-react';
import { KitchenOrderCard } from '../../../../application/kitchen/use-cases/get-kitchen-orders.use-case';
import {
  getKitchenOrdersAction,
  bumpKitchenOrderAction,
  toggleKitchenItemPreparedAction,
} from '../../../actions/kitchen.actions';
import {
  KitchenOrderTicketPrint,
  KitchenTicketData,
} from '../../../../components/printing/kitchen-order-ticket';

export interface BranchOption {
  id: string;
  nameAr: string;
  code: string;
  isActive: boolean;
}

interface KitchenKdsClientProps {
  initialOrders: KitchenOrderCard[];
  branches: BranchOption[];
  restaurantNameAr?: string;
  restaurantNameEn?: string;
  isBranchRestricted?: boolean;
  userBranchId?: string | null;
}

type OrderTypeFilter = 'ALL' | 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

export function KitchenKdsClient({
  initialOrders,
  branches,
  restaurantNameAr = 'المطعم',
  restaurantNameEn = 'Restaurant',
  isBranchRestricted = false,
  userBranchId = null,
}: KitchenKdsClientProps) {
  const [orders, setOrders] = useState<KitchenOrderCard[]>(initialOrders);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    isBranchRestricted && userBranchId ? userBranchId : 'ALL'
  );
  const [typeFilter, setTypeFilter] = useState<OrderTypeFilter>('ALL');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Sound preference state
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('resto_kitchen_sound_muted') === 'true';
    }
    return false;
  });

  // Action pending states
  const [bumpingOrderId, setBumpingOrderId] = useState<string | null>(null);
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Print state
  const [printingKot, setPrintingKot] = useState<KitchenTicketData | null>(null);

  // Live timer tick (updates every 1000ms)
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Ref to track known order IDs for sound notification
  const prevOrderIdsRef = useRef<Set<string>>(new Set(initialOrders.map((o) => o.id)));

  // Sound alert using Web Audio API
  const playAlertSound = useCallback(() => {
    if (isMuted) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5 note
      osc.frequency.exponentialRampToValueAtTime(987.77, ctx.currentTime + 0.18); // B5 note

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.42);
    } catch {
      // Audio playback silently suppressed if blocked by browser policy
    }
  }, [isMuted]);

  // Sound toggle handler
  const handleToggleSound = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('resto_kitchen_sound_muted', String(nextState));
    }
  };

  // Live timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen request rejected or unavailable
    }
  };

  // Fetch / Refresh kitchen orders
  const refreshOrders = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setIsRefreshing(true);
      try {
        const branchParam =
          selectedBranchId !== 'ALL'
            ? selectedBranchId
            : isBranchRestricted && userBranchId
            ? userBranchId
            : undefined;

        const res = await getKitchenOrdersAction({ branchId: branchParam });
        if (res.success && res.data) {
          const freshOrders = res.data;

          // Check if any new orders arrived
          const knownIds = prevOrderIdsRef.current;
          const hasNewOrders = freshOrders.some((o) => !knownIds.has(o.id));
          if (hasNewOrders) {
            playAlertSound();
          }

          // Update ref with current set of IDs
          prevOrderIdsRef.current = new Set(freshOrders.map((o) => o.id));
          setOrders(freshOrders);
        }
      } catch (err) {
        console.error('Failed to refresh kitchen orders:', err);
      } finally {
        if (!isBackground) setIsRefreshing(false);
      }
    },
    [selectedBranchId, isBranchRestricted, userBranchId, playAlertSound]
  );

  // Polling effect (every 12 seconds)
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    const interval = setInterval(() => {
      refreshOrders(true);
    }, 12000);
    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refreshOrders]);

  // Handle branch switch
  const handleBranchChange = (newBranchId: string) => {
    setSelectedBranchId(newBranchId);
  };

  // Trigger print when printingKot is set
  useEffect(() => {
    if (!printingKot) return;
    const timer = setTimeout(() => {
      window.print();
      setPrintingKot(null);
    }, 150);
    return () => clearTimeout(timer);
  }, [printingKot]);

  // Bump order (mark ready for pickup)
  const handleBumpOrder = async (order: KitchenOrderCard) => {
    if (!order.branchId) {
      alert('لا يمكن تجهيز الطلب لعدم تحديد فرع للطلب.');
      return;
    }

    setBumpingOrderId(order.id);
    try {
      const res = await bumpKitchenOrderAction({
        orderId: order.id,
        branchId: order.branchId,
      });

      if (res.success) {
        startTransition(() => {
          setOrders((prev) => prev.filter((o) => o.id !== order.id));
        });
      } else {
        alert(res.error || 'فشل تحديث حالة الطلب');
      }
    } catch (err) {
      console.error('Kitchen KDS bump error:', err);
      alert('حدث خطأ أثناء إنهاء وتجهيز الطلب');
    } finally {
      setBumpingOrderId(null);
    }
  };

  // Toggle single item prepared status
  const handleToggleItem = async (order: KitchenOrderCard, itemId: string, currentStatus: boolean) => {
    setTogglingItemId(itemId);
    try {
      const res = await toggleKitchenItemPreparedAction({
        orderItemId: itemId,
        isPrepared: !currentStatus,
        branchId: order.branchId ?? undefined,
      });

      if (res.success) {
        startTransition(() => {
          setOrders((prev) =>
            prev.map((o) => {
              if (o.id !== order.id) return o;
              const nextItems = o.items.map((i) =>
                i.id === itemId
                  ? {
                      ...i,
                      isPrepared: !currentStatus,
                      preparedAt: !currentStatus ? new Date().toISOString() : null,
                    }
                  : i
              );
              const prepCount = nextItems.filter((i) => i.isPrepared).length;
              return {
                ...o,
                items: nextItems,
                preparedItemsCount: prepCount,
              };
            })
          );
        });
      } else {
        alert(res.error || 'فشل تحديث حالة الصنف');
      }
    } catch (err) {
      console.error('Kitchen KDS item toggle error:', err);
      alert('حدث خطأ أثناء تحديث حالة الصنف');
    } finally {
      setTogglingItemId(null);
    }
  };

  // Print KOT handler
  const handlePrintKot = (order: KitchenOrderCard) => {
    const kotData: KitchenTicketData = {
      orderNumber: order.orderNumber,
      type: order.type,
      tableName: order.tableName,
      sectionName: order.sectionNameAr,
      customerName: order.customerName,
      customerNotes: order.customerNotes,
      kitchenNotes: order.kitchenNotes,
      createdAt: order.createdAt,
      branchName: order.branchNameAr,
      items: order.items.map((i) => ({
        productNameAr: i.productNameAr,
        productNameEn: i.productNameEn,
        sizeNameAr: i.sizeNameAr,
        sizeNameEn: i.sizeNameEn,
        quantity: i.quantity,
        modifiers: i.modifiers.map((m) => ({
          nameAr: m.nameAr,
          nameEn: m.nameEn,
        })),
      })),
    };
    setPrintingKot(kotData);
  };

  // Filter orders by selected type
  const filteredOrders = orders.filter((o) => {
    if (typeFilter === 'ALL') return true;
    return o.type === typeFilter;
  });

  // Calculate counts for filters
  const dineInCount = orders.filter((o) => o.type === 'DINE_IN').length;
  const takeawayCount = orders.filter((o) => o.type === 'TAKEAWAY').length;
  const deliveryCount = orders.filter((o) => o.type === 'DELIVERY').length;

  // Format stopwatch elapsed time
  const getElapsedDisplay = (startedAtIso: string, fallbackElapsedSeconds: number) => {
    const elapsedSecs =
      currentTime > 0
        ? Math.max(0, Math.floor((currentTime - new Date(startedAtIso).getTime()) / 1000))
        : fallbackElapsedSeconds;
    const mins = Math.floor(elapsedSecs / 60);
    const secs = elapsedSecs % 60;
    const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    let badgeClass = 'bg-zinc-800 text-zinc-300 border-zinc-700';
    let isUrgent = false;

    if (mins >= 20) {
      badgeClass = 'bg-rose-950 text-rose-300 border-rose-600 animate-pulse font-black';
      isUrgent = true;
    } else if (mins >= 10) {
      badgeClass = 'bg-amber-950/80 text-amber-300 border-amber-600 font-bold';
    } else {
      badgeClass = 'bg-emerald-950/70 text-emerald-400 border-emerald-800/80 font-medium';
    }

    return { formatted, badgeClass, isUrgent };
  };

  const getOrderTypeBadge = (order: KitchenOrderCard) => {
    switch (order.type) {
      case 'DINE_IN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs sm:text-sm font-black bg-sky-950 text-sky-300 border border-sky-700/80 shadow-xs">
            <Utensils className="w-4 h-4 text-sky-400" />
            <span>{order.tableName ? `طاولة ${order.tableName}` : 'صالة'}</span>
          </span>
        );
      case 'TAKEAWAY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs sm:text-sm font-black bg-amber-950 text-amber-300 border border-amber-700/80 shadow-xs">
            <Store className="w-4 h-4 text-amber-400" />
            <span>سفري</span>
          </span>
        );
      case 'DELIVERY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs sm:text-sm font-black bg-indigo-950 text-indigo-300 border border-indigo-700/80 shadow-xs">
            <Bike className="w-4 h-4 text-indigo-400" />
            <span>توصيل</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-300 font-bold">
            {order.type}
          </span>
        );
    }
  };

  return (
    <div
      dir="rtl"
      className={`min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none ${
        isFullscreen ? 'fixed inset-0 z-50 overflow-y-auto' : ''
      }`}
    >
      {/* Printable KOT Component (Only renders when triggered) */}
      <KitchenOrderTicketPrint ticket={printingKot} restaurantName={restaurantNameAr} />

      {/* Top Navigation & Operational Control Bar */}
      <header className="sticky top-0 z-30 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 px-4 py-3 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Right Section: Back to Admin + Title and Active Count */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="العودة للوحة التحكم"
            >
              <ArrowRight className="w-4 h-4" />
              <span className="hidden sm:inline">لوحة التحكم</span>
            </Link>
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-100 shadow-xs">
              <ChefHat className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white">شاشة المطبخ (KDS)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {orders.length} نشط
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {restaurantNameAr} • {restaurantNameEn}
              </p>
            </div>
          </div>

          {/* Center Section: Order Type Filter Tabs */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 overflow-x-auto">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                typeFilter === 'ALL'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              الكل ({orders.length})
            </button>
            <button
              onClick={() => setTypeFilter('DINE_IN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                typeFilter === 'DINE_IN'
                  ? 'bg-sky-950 text-sky-300 border border-sky-800'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              صالة ({dineInCount})
            </button>
            <button
              onClick={() => setTypeFilter('TAKEAWAY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                typeFilter === 'TAKEAWAY'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              سفري ({takeawayCount})
            </button>
            <button
              onClick={() => setTypeFilter('DELIVERY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                typeFilter === 'DELIVERY'
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              توصيل ({deliveryCount})
            </button>
          </div>

          {/* Left Section: Controls & Branch Switcher */}
          <div className="flex items-center gap-2">
            {/* Branch Switcher Dropdown */}
            {!isBranchRestricted && (
              <select
                value={selectedBranchId}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-xl px-3 py-2 font-medium focus:outline-hidden focus:ring-1 focus:ring-zinc-500"
              >
                <option value="ALL">جميع الفروع</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nameAr}
                  </option>
                ))}
              </select>
            )}

            {/* Sound Toggle */}
            <button
              onClick={handleToggleSound}
              title={isMuted ? 'تفعيل التنبيه الصوتي' : 'كتم التنبيه الصوتي'}
              className={`p-2 rounded-xl border text-xs font-medium transition-colors ${
                isMuted
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                  : 'bg-emerald-950/80 border-emerald-700 text-emerald-400'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Auto Refresh Toggle */}
            <button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              title={autoRefreshEnabled ? 'إيقاف التحديث التلقائي مؤقتاً' : 'تشغيل التحديث التلقائي'}
              className={`p-2 rounded-xl border text-xs font-medium transition-colors ${
                autoRefreshEnabled
                  ? 'bg-zinc-800 border-zinc-700 text-emerald-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-500'
              }`}
            >
              {autoRefreshEnabled ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>

            {/* Manual Refresh */}
            <button
              onClick={() => refreshOrders(false)}
              disabled={isRefreshing}
              title="تحديث فوري"
              className="p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={handleToggleFullscreen}
              title={isFullscreen ? 'تصغير الشاشة' : 'ملء الشاشة'}
              className="p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Order Tickets Canvas */}
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        {filteredOrders.length === 0 ? (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center p-6 rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/30">
            <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-4 shadow-inner">
              <ChefHat className="w-10 h-10 stroke-[1.5]" />
            </div>
            <h3 className="text-xl font-bold text-zinc-200 mb-1">
              لا توجد طلبات قيد التجهيز في المطبخ حالياً
            </h3>
            <p className="text-sm text-zinc-400 max-w-sm">
              المطبخ في وضع الجاهزية. ستظهر التذاكر الجديدة هنا فور تأكيدها وتتحرك بشكل تسلسلي حسب وقت النزول.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map((order) => {
              const { formatted: elapsedText, badgeClass: timerBadgeClass, isUrgent } = getElapsedDisplay(
                order.kitchenStartedAt,
                order.elapsedSeconds
              );
              const isBumping = bumpingOrderId === order.id;
              const isAllPrepared =
                order.totalItemsCount > 0 && order.preparedItemsCount === order.totalItemsCount;

              return (
                <div
                  key={order.id}
                  className={`bg-zinc-900 border rounded-2xl shadow-xl flex flex-col justify-between overflow-hidden transition-all duration-200 ${
                    isUrgent
                      ? 'border-rose-600/70 shadow-rose-950/20'
                      : isAllPrepared
                      ? 'border-emerald-600/60 shadow-emerald-950/20'
                      : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {/* Ticket Header */}
                  <div className="p-3.5 bg-zinc-950/70 border-b border-zinc-800/80">
                    {/* Row 1: Destination / Order Type Badge + Timer */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        {getOrderTypeBadge(order)}
                        {order.branchNameAr && selectedBranchId === 'ALL' && (
                          <span className="text-zinc-500 text-[11px] font-medium">({order.branchNameAr})</span>
                        )}
                      </div>

                      {/* Elapsed Timer Badge */}
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs border ${timerBadgeClass} shadow-xs shrink-0`}
                        title="الوقت المنقضي منذ بدء التجهيز"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span className="font-mono text-xs font-bold">{elapsedText}</span>
                      </div>
                    </div>

                    {/* Row 2: Order Number (LTR nowrap) + Customer Name + Reprint KOT */}
                    <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-zinc-800/50">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="font-mono text-xs font-bold text-zinc-300 tracking-wider whitespace-nowrap bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-700/60"
                          dir="ltr"
                        >
                          #{order.orderNumber}
                        </span>
                        {order.customerName && (
                          <span className="text-zinc-300 font-medium truncate max-w-[130px]">
                            {order.customerName}
                          </span>
                        )}
                      </div>

                      {/* Reprint KOT Button */}
                      <button
                        onClick={() => handlePrintKot(order)}
                        title="إعادة طباعة بون المطبخ (80mm)"
                        className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Kitchen or Customer Notes Alert */}
                    {(order.kitchenNotes || order.customerNotes) && (
                      <div className="mt-2.5 p-2 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-200 text-xs flex items-start gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="leading-relaxed">
                          {order.kitchenNotes && (
                            <p className="font-bold text-amber-300">ملاحظة مطبخ: {order.kitchenNotes}</p>
                          )}
                          {order.customerNotes && (
                            <p className="text-amber-200/90">ملاحظة زبون: {order.customerNotes}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Items Preparation Checklist */}
                  <div className="p-3 flex-1 overflow-y-auto max-h-[360px] divide-y divide-zinc-800/60">
                    {order.items.map((item) => {
                      const isItemLoading = togglingItemId === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleToggleItem(order, item.id, item.isPrepared)}
                          className={`py-2 px-1.5 rounded-xl transition-all cursor-pointer flex items-start justify-between gap-2.5 group ${
                            item.isPrepared
                              ? 'bg-zinc-950/40 opacity-55'
                              : 'hover:bg-zinc-800/50'
                          }`}
                        >
                          {/* Item Details */}
                          <div className="flex items-start gap-2 flex-1">
                            {/* Quantity Badge */}
                            <span
                              className={`shrink-0 px-2 py-0.5 rounded-md text-xs font-black font-mono ${
                                item.isPrepared
                                  ? 'bg-zinc-800 text-zinc-400'
                                  : 'bg-zinc-800 text-emerald-400 border border-zinc-700'
                              }`}
                            >
                              {item.quantity}×
                            </span>

                            <div className="flex-1">
                              <p
                                className={`text-sm font-bold leading-snug transition-all ${
                                  item.isPrepared
                                    ? 'line-through text-zinc-500'
                                    : 'text-zinc-100 group-hover:text-emerald-300'
                                }`}
                              >
                                {item.productNameAr}
                                {item.sizeNameAr && (
                                  <span className="text-xs font-normal text-zinc-400 mr-1.5">
                                    ({item.sizeNameAr})
                                  </span>
                                )}
                              </p>

                              {/* Modifiers List */}
                              {item.modifiers.length > 0 && (
                                <ul className="mt-1 space-y-0.5">
                                  {item.modifiers.map((m) => (
                                    <li
                                      key={m.id}
                                      className="text-xs text-zinc-400 flex items-center gap-1 font-medium"
                                    >
                                      <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                                      <span>{m.nameAr}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>

                          {/* Item Prepared Checkbox */}
                          <button
                            type="button"
                            disabled={isItemLoading}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                              item.isPrepared
                                ? 'bg-emerald-600 border-emerald-500 text-white'
                                : 'border-zinc-700 group-hover:border-zinc-500 text-transparent'
                            }`}
                          >
                            {isItemLoading ? (
                              <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
                            ) : item.isPrepared ? (
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            ) : null}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Ticket Footer & Bump Action */}
                  <div className="p-3 bg-zinc-950/90 border-t border-zinc-800/80 space-y-2">
                    {/* Item Progress Bar */}
                    <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                      <span>إنجاز الأصناف</span>
                      <span className="font-mono font-bold text-zinc-300">
                        {order.preparedItemsCount} / {order.totalItemsCount}
                      </span>
                    </div>

                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{
                          width: `${
                            order.totalItemsCount > 0
                              ? (order.preparedItemsCount / order.totalItemsCount) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>

                    {/* Big Touch Bump Button */}
                    <button
                      type="button"
                      disabled={isBumping}
                      onClick={() => handleBumpOrder(order)}
                      className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 ${
                        isAllPrepared
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 ring-2 ring-emerald-500/50'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700'
                      } disabled:opacity-50`}
                    >
                      {isBumping ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>جاري التسليم...</span>
                        </>
                      ) : (
                        <>
                          <CheckCheck className="w-4 h-4 stroke-[2]" />
                          <span>تم التجهيز (Bump)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
