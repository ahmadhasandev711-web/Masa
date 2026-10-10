'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Receipt,
  Search,
  RefreshCw,
  Printer,
  Eye,
  CheckCircle2,
  Clock,
  CreditCard,
  Banknote,
  Utensils,
  Store,
  Bike,
  ChefHat,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw,
  SlidersHorizontal,
  Calendar,
} from 'lucide-react';
import { listOrdersAction } from '../../../actions/order.actions';
import { ThermalReceipt } from '../orders/thermal-receipt';
import { KitchenOrderTicketPrint, KitchenTicketData } from '../../../../components/printing/kitchen-order-ticket';

export interface BranchOption {
  id: string;
  nameAr: string;
  code: string;
  isActive: boolean;
}

export interface CashierOption {
  id: string;
  fullName: string;
  username: string;
}

export interface InvoiceOrderItem {
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

export interface InvoicePaymentRecord {
  id: string;
  method: string;
  amountMinor: number;
  createdAt: Date | string;
}

export interface InvoiceOrderRecord {
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
  currency?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  tableId?: string | null;
  tableName?: string | null;
  guestCount?: number | null;
  isTabOpen?: boolean;
  createdAt: Date | string;
  branchId?: string | null;
  branch?: {
    id: string;
    nameAr: string;
    nameEn: string;
    code: string;
  } | null;
  cashier?: {
    id: string;
    fullName: string;
    username: string;
  } | null;
  table?: {
    id: string;
    tableNumber: string;
    section?: {
      nameAr: string;
    } | null;
  } | null;
  cashShift?: {
    id: string;
    status: string;
    openedAt: Date | string;
    closedAt?: Date | string | null;
  } | null;
  payments?: InvoicePaymentRecord[];
  items: InvoiceOrderItem[];
  driver?: {
    id: string;
    fullName: string;
    phone: string;
    vehicleType?: string;
  } | null;
  customerNotes?: string | null;
  kitchenNotes?: string | null;
  kitchenStartedAt?: Date | string | null;
  kitchenCompletedAt?: Date | string | null;
  dispatchedAt?: Date | string | null;
  deliveredAt?: Date | string | null;
}

export interface InvoiceMetrics {
  totalOrders: number;
  totalSalesMinor: number;
  paidCount: number;
  dineInSalesMinor: number;
  dineInCount: number;
  takeawaySalesMinor: number;
  takeawayCount: number;
  deliverySalesMinor: number;
  deliveryCount: number;
  pendingCount: number;
}

type DatePreset = 'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'CUSTOM';

function getDateRangeForPreset(preset: DatePreset): { dateFrom: string; dateTo: string } {
  const today = new Date();
  const formatYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  if (preset === 'TODAY') {
    const dStr = formatYMD(today);
    return { dateFrom: dStr, dateTo: dStr };
  }
  if (preset === 'YESTERDAY') {
    const yest = new Date(today.getTime() - 86400000);
    const dStr = formatYMD(yest);
    return { dateFrom: dStr, dateTo: dStr };
  }
  if (preset === 'WEEK') {
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    return { dateFrom: formatYMD(weekAgo), dateTo: formatYMD(today) };
  }
  if (preset === 'MONTH') {
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return { dateFrom: formatYMD(firstDay), dateTo: formatYMD(today) };
  }
  return { dateFrom: '', dateTo: '' };
}

interface InvoicesClientProps {
  initialOrders: InvoiceOrderRecord[];
  initialTotalCount: number;
  initialMetrics?: InvoiceMetrics;
  branches: BranchOption[];
  cashiers: CashierOption[];
  currencySymbol?: string;
  restaurantNameAr?: string;
  restaurantNameEn?: string;
  isBranchRestricted?: boolean;
  userBranchId?: string | null;
}

export function InvoicesClient({
  initialOrders,
  initialTotalCount,
  initialMetrics,
  branches,
  cashiers,
  currencySymbol = 'ج.م',
  restaurantNameAr = 'المطعم',
  restaurantNameEn = 'Restaurant',
  isBranchRestricted = false,
  userBranchId = null,
}: InvoicesClientProps) {
  const [orders, setOrders] = useState<InvoiceOrderRecord[]>(initialOrders);
  const [totalCount, setTotalCount] = useState<number>(initialTotalCount);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Financial aggregate metrics (accurate for full dataset matching filters)
  const [metrics, setMetrics] = useState<InvoiceMetrics>(
    initialMetrics || {
      totalOrders: initialTotalCount,
      totalSalesMinor: initialOrders
        .filter((o) => o.paymentStatus === 'PAID')
        .reduce((s, o) => s + o.totalMinor, 0),
      paidCount: initialOrders.filter((o) => o.paymentStatus === 'PAID').length,
      dineInSalesMinor: initialOrders
        .filter((o) => o.type === 'DINE_IN' && o.paymentStatus === 'PAID')
        .reduce((s, o) => s + o.totalMinor, 0),
      dineInCount: initialOrders.filter((o) => o.type === 'DINE_IN').length,
      takeawaySalesMinor: initialOrders
        .filter((o) => o.type === 'TAKEAWAY' && o.paymentStatus === 'PAID')
        .reduce((s, o) => s + o.totalMinor, 0),
      takeawayCount: initialOrders.filter((o) => o.type === 'TAKEAWAY').length,
      deliverySalesMinor: initialOrders
        .filter((o) => o.type === 'DELIVERY' && o.paymentStatus === 'PAID')
        .reduce((s, o) => s + o.totalMinor, 0),
      deliveryCount: initialOrders.filter((o) => o.type === 'DELIVERY').length,
      pendingCount: initialOrders.filter((o) => o.paymentStatus === 'PENDING').length,
    }
  );

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Filters State
  const [filters, setFilters] = useState({
    branchId: isBranchRestricted && userBranchId ? userBranchId : 'ALL',
    source: 'ALL',
    type: 'ALL',
    paymentStatus: 'ALL',
    paymentMethod: 'ALL',
    cashierId: 'ALL',
    datePreset: 'ALL' as DatePreset,
    dateFrom: '',
    dateTo: '',
  });

  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Audit Modal & Print
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceOrderRecord | null>(null);
  const [printingThermalOrder, setPrintingThermalOrder] = useState<InvoiceOrderRecord | null>(null);
  const [printingKot, setPrintingKot] = useState<KitchenTicketData | null>(null);

  // Stable state ref prevents recreate cycles & render loops
  const stateRef = useRef({
    filters,
    searchQuery,
    currentPage,
    pageSize,
  });
  useEffect(() => {
    stateRef.current = { filters, searchQuery, currentPage, pageSize };
  }, [filters, searchQuery, currentPage, pageSize]);

  // Guaranteed single stable fetcher function
  const executeFetch = useCallback(
    async (overrides?: {
      filters?: typeof filters;
      search?: string;
      page?: number;
      limit?: number;
    }) => {
      setIsRefreshing(true);
      try {
        const current = stateRef.current;
        const targetFilters = overrides?.filters ?? current.filters;
        const targetSearch = overrides?.search !== undefined ? overrides.search : current.searchQuery;
        const targetPage = overrides?.page ?? current.currentPage;
        const targetLimit = overrides?.limit ?? current.pageSize;

        const effectiveBranchId = isBranchRestricted && userBranchId ? userBranchId : targetFilters.branchId;

        const res = await listOrdersAction({
          branchId: effectiveBranchId !== 'ALL' ? effectiveBranchId : undefined,
          source: targetFilters.source,
          type: targetFilters.type !== 'ALL' ? targetFilters.type : undefined,
          paymentStatus: targetFilters.paymentStatus !== 'ALL' ? targetFilters.paymentStatus : undefined,
          paymentMethod: targetFilters.paymentMethod !== 'ALL' ? targetFilters.paymentMethod : undefined,
          cashierId: targetFilters.cashierId !== 'ALL' ? targetFilters.cashierId : undefined,
          dateFrom: targetFilters.dateFrom || undefined,
          dateTo: targetFilters.dateTo || undefined,
          search: targetSearch.trim() || undefined,
          page: targetPage,
          limit: targetLimit,
        });

        if (res.success && res.data) {
          setOrders(res.data.orders as unknown as InvoiceOrderRecord[]);
          setTotalCount(res.data.pagination.total);
          if (res.data.metrics) {
            setMetrics(res.data.metrics);
          }
        }
      } catch (err) {
        console.error('Failed to fetch invoices:', err);
      } finally {
        setIsRefreshing(false);
      }
    },
    [isBranchRestricted, userBranchId]
  );

  // Debounced search effect - ONLY fires on search text changes (no re-render loops)
  const isInitialSearchMount = useRef(true);
  useEffect(() => {
    if (isInitialSearchMount.current) {
      isInitialSearchMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setCurrentPage(1);
      executeFetch({ search: searchQuery, page: 1 });
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, executeFetch]);

  // Reactive Instant Filter Updater
  const updateFilter = (changes: Partial<typeof filters>) => {
    const next = { ...filters, ...changes };
    setFilters(next);
    setCurrentPage(1);
    executeFetch({ filters: next, page: 1 });
  };

  const handleDatePresetChange = (preset: DatePreset) => {
    if (preset === 'CUSTOM') {
      setFilters((prev) => ({ ...prev, datePreset: 'CUSTOM' }));
      return;
    }
    const range = getDateRangeForPreset(preset);
    updateFilter({
      datePreset: preset,
      dateFrom: range.dateFrom,
      dateTo: range.dateTo,
    });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    executeFetch({ search: '', page: 1 });
  };

  const handleResetFilters = () => {
    const defaultBranch = isBranchRestricted && userBranchId ? userBranchId : 'ALL';
    const defaultFilters = {
      branchId: defaultBranch,
      source: 'ALL',
      type: 'ALL',
      paymentStatus: 'ALL',
      paymentMethod: 'ALL',
      cashierId: 'ALL',
      datePreset: 'ALL' as DatePreset,
      dateFrom: '',
      dateTo: '',
    };
    setFilters(defaultFilters);
    setSearchQuery('');
    setCurrentPage(1);
    executeFetch({ filters: defaultFilters, search: '', page: 1 });
  };

  const hasActiveFilters = Boolean(
    (filters.branchId !== 'ALL' && (!isBranchRestricted || filters.branchId !== userBranchId)) ||
    filters.source !== 'ALL' ||
    filters.type !== 'ALL' ||
    filters.paymentStatus !== 'ALL' ||
    filters.paymentMethod !== 'ALL' ||
    filters.cashierId !== 'ALL' ||
    filters.datePreset !== 'ALL' ||
    filters.dateFrom ||
    filters.dateTo ||
    searchQuery.trim()
  );

  // Pagination navigation
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    executeFetch({ page: newPage });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    executeFetch({ page: 1, limit: newSize });
  };

  // Money formatting helper (GR-8.2 minor units)
  const formatMoney = (minor: number) => {
    return `${(minor / 100).toFixed(2)} ${currencySymbol}`;
  };

  // Thermal Receipt print
  const handlePrintThermal = (order: InvoiceOrderRecord) => {
    setPrintingKot(null);
    setPrintingThermalOrder(order);
    setTimeout(() => {
      window.print();
      setPrintingThermalOrder(null);
    }, 150);
  };

  // Kitchen Order Ticket (KOT) print
  const handlePrintKot = (order: InvoiceOrderRecord) => {
    setPrintingThermalOrder(null);
    const kotData: KitchenTicketData = {
      orderNumber: order.orderNumber,
      type: order.type,
      tableName: order.tableName,
      sectionName: order.table?.section?.nameAr ?? null,
      customerName: order.customerName,
      customerNotes: order.customerNotes,
      kitchenNotes: order.kitchenNotes,
      createdAt: order.createdAt,
      branchName: order.branch?.nameAr ?? null,
      items: order.items.map((i) => ({
        productNameAr: i.productNameAr,
        productNameEn: i.productNameEn,
        sizeNameAr: i.sizeNameAr,
        sizeNameEn: i.sizeNameEn,
        quantity: i.quantity,
        modifiers: i.modifiers.map((m) => ({ nameAr: m.nameAr, nameEn: m.nameEn })),
      })),
    };
    setPrintingKot(kotData);
    setTimeout(() => {
      window.print();
      setPrintingKot(null);
    }, 150);
  };

  // Export current list to Excel / CSV with Arabic UTF-8 BOM
  const handleExportCsv = () => {
    if (!orders.length) return;

    const headers = [
      'رقم الفاتورة',
      'التاريخ والوقت',
      'الفرع',
      'نوع الطلب',
      'القناة',
      'الكاشير / المسؤول',
      'حالة السداد',
      'طريقة الدفع',
      'عدد الأصناف',
      'الإجمالي (ج.م)',
    ];

    const rows = orders.map((o) => {
      const typeLabel =
        o.type === 'DINE_IN'
          ? `صالة (${o.tableName || 'طاولة'})`
          : o.type === 'TAKEAWAY'
          ? 'سفري'
          : 'توصيل';
      const sourceLabel = o.source === 'POS' ? 'كاشير POS' : 'المتجر أونلاين';
      const statusLabel = o.paymentStatus === 'PAID' ? 'مدفوعة' : 'شيك مفتوح';
      const methodLabel =
        o.paymentMethod === 'CASH'
          ? 'نقدي'
          : o.paymentMethod === 'CARD'
          ? 'بطاقة'
          : o.paymentMethod === 'MIXED'
          ? 'مختلط'
          : o.paymentMethod;

      return [
        `"${o.orderNumber}"`,
        `"${new Date(o.createdAt).toLocaleString('ar-EG')}"`,
        `"${o.branch?.nameAr || '—'}"`,
        `"${typeLabel}"`,
        `"${sourceLabel}"`,
        `"${o.cashier?.fullName || (o.source === 'ONLINE' ? 'الموقع العام' : '—')}"`,
        `"${statusLabel}"`,
        `"${methodLabel}"`,
        o.items.reduce((acc, it) => acc + it.quantity, 0),
        (o.totalMinor / 100).toFixed(2),
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoices_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* Hidden Thermal Prints */}
      {printingThermalOrder && (
        <ThermalReceipt
          order={{
            ...printingThermalOrder,
            customerName: printingThermalOrder.customerName || 'عميل نقدي',
            customerPhone: printingThermalOrder.customerPhone || '—',
          }}
          restaurantNameAr={restaurantNameAr}
          restaurantNameEn={restaurantNameEn}
          currencySymbol={currencySymbol}
        />
      )}
      {printingKot && (
        <KitchenOrderTicketPrint ticket={printingKot} restaurantName={restaurantNameAr} />
      )}

      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 border-b border-zinc-200/80 pb-3.5">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-zinc-900 text-white shadow-2xs shrink-0">
            <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-zinc-900">
                سجل ومراجعة الفواتير
              </h1>
              {hasActiveFilters && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>نتائج مخصصة ({totalCount})</span>
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-sm text-zinc-500 font-medium mt-0.5">
              مركز الرقابة المالية ومراجعة فواتير الصالة ونقاط البيع والتوصيل
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={isRefreshing}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition shadow-2xs cursor-pointer disabled:opacity-50"
              title="إلغاء جميع الفلاتر والعودة للسجل الشامل"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!orders.length}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition shadow-2xs cursor-pointer disabled:opacity-50"
            title="تصدير كشف الفواتير لملف Excel / CSV"
          >
            <Download className="w-3.5 h-3.5 text-zinc-600" />
            <span>تصدير Excel</span>
          </button>

          <button
            type="button"
            onClick={() => executeFetch()}
            disabled={isRefreshing}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-zinc-900 rounded-xl hover:bg-zinc-800 transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (Executive & Focused 4-Card Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Total Collected Revenue */}
        <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-zinc-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 text-[10px] sm:text-[11px] font-semibold">
            <span>المبيعات المحصلة</span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-emerald-50 text-emerald-700 grid place-items-center">
              <Banknote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-black text-emerald-600 font-mono mt-1.5 sm:mt-2 whitespace-nowrap">
            {formatMoney(metrics.totalSalesMinor)}
          </p>
          <span className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5 sm:mt-1 block">
            {metrics.paidCount} فاتورة مسددة
          </span>
        </div>

        {/* Dine-In Bills */}
        <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-zinc-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 text-[10px] sm:text-[11px] font-semibold">
            <span>الصالة والطاولات</span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-sky-50 text-sky-700 grid place-items-center">
              <Utensils className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-black text-zinc-900 font-mono mt-1.5 sm:mt-2 whitespace-nowrap">
            {formatMoney(metrics.dineInSalesMinor)}
          </p>
          <span className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5 sm:mt-1 block">
            {metrics.dineInCount} طلب صالة
          </span>
        </div>

        {/* Takeaway & Delivery Bills */}
        <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-zinc-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 text-[10px] sm:text-[11px] font-semibold">
            <span>السفري والتوصيل</span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-amber-50 text-amber-700 grid place-items-center">
              <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-black text-zinc-900 font-mono mt-1.5 sm:mt-2 whitespace-nowrap">
            {formatMoney(metrics.takeawaySalesMinor + metrics.deliverySalesMinor)}
          </p>
          <span className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5 sm:mt-1 block">
            {metrics.takeawayCount} سفري • {metrics.deliveryCount} توصيل
          </span>
        </div>

        {/* Pending / Open Tabs */}
        <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-zinc-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 text-[10px] sm:text-[11px] font-semibold">
            <span>شيكات معلقة</span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-rose-50 text-rose-700 grid place-items-center">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-black text-rose-600 font-mono mt-1.5 sm:mt-2 whitespace-nowrap">
            {metrics.pendingCount}
          </p>
          <span className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5 sm:mt-1 block">
            بانتظار التحصيل
          </span>
        </div>
      </div>

      {/* 3. Sleek Command Control Bar (Modern, Unified, No Visual Clutter) */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xs space-y-3.5">
        {/* Tier 1: Search + Quick Date Range Buttons */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3.5 top-3 text-zinc-400" />
            <input
              type="text"
              placeholder="بحث برقم الفاتورة، اسم الزبون، أو الطاولة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-8 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-1 focus:ring-zinc-800 outline-hidden font-medium placeholder:text-zinc-400 bg-zinc-50/50 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute left-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                title="مسح البحث"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Date Range - Desktop View (Hidden on mobile, flex on sm+) */}
          <div className="hidden sm:flex items-center gap-1 bg-zinc-100/80 p-1 rounded-xl text-xs">
            {[
              { id: 'ALL', label: 'الكل' },
              { id: 'TODAY', label: 'اليوم' },
              { id: 'YESTERDAY', label: 'أمس' },
              { id: 'WEEK', label: 'آخر 7 أيام' },
              { id: 'MONTH', label: 'هذا الشهر' },
              { id: 'CUSTOM', label: 'مخصص' },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleDatePresetChange(preset.id as DatePreset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  filters.datePreset === preset.id
                    ? 'bg-zinc-900 text-white shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Date Range - Mobile View (Grid 3x2: Full width, zero clipping, touch-optimized) */}
        <div className="grid sm:hidden grid-cols-3 gap-1 bg-zinc-100/80 p-1 rounded-xl text-xs w-full">
          {[
            { id: 'ALL', label: 'الكل' },
            { id: 'TODAY', label: 'اليوم' },
            { id: 'YESTERDAY', label: 'أمس' },
            { id: 'WEEK', label: 'آخر 7 أيام' },
            { id: 'MONTH', label: 'هذا الشهر' },
            { id: 'CUSTOM', label: 'مخصص' },
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleDatePresetChange(preset.id as DatePreset)}
              className={`w-full py-2 px-1 text-center rounded-lg text-xs font-bold transition cursor-pointer ${
                filters.datePreset === preset.id
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers (Shown only if 'CUSTOM' selected) */}
        {filters.datePreset === 'CUSTOM' && (
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70 text-xs animate-in fade-in duration-150 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-zinc-700">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>تحديد الفترة الزمنية المخصصة:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-zinc-200 rounded-lg">
                <span className="text-[11px] font-bold text-zinc-400 whitespace-nowrap">من:</span>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter({ dateFrom: e.target.value })}
                  className="w-full bg-transparent text-xs font-medium text-zinc-800 outline-hidden"
                  title="من تاريخ"
                />
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-zinc-200 rounded-lg">
                <span className="text-[11px] font-bold text-zinc-400 whitespace-nowrap">إلى:</span>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => updateFilter({ dateTo: e.target.value })}
                  className="w-full bg-transparent text-xs font-medium text-zinc-800 outline-hidden"
                  title="إلى تاريخ"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tier 2: Status, Type, and Select Dropdowns */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-3 border-t border-zinc-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Pills */}
            <div className="flex items-center gap-1 bg-zinc-50 p-1 rounded-xl border border-zinc-200/70">
              <span className="text-[10px] text-zinc-400 font-bold px-1">السداد:</span>
              {[
                { id: 'ALL', label: 'الكل' },
                { id: 'PAID', label: 'مدفوعة' },
                { id: 'PENDING', label: 'شيك مفتوح' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => updateFilter({ paymentStatus: tab.id })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    filters.paymentStatus === tab.id
                      ? tab.id === 'PAID'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : tab.id === 'PENDING'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-zinc-900 text-white shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Type Pills */}
            <div className="flex items-center gap-1 bg-zinc-50 p-1 rounded-xl border border-zinc-200/70">
              <span className="text-[10px] text-zinc-400 font-bold px-1">النوع:</span>
              {[
                { id: 'ALL', label: 'الكل' },
                { id: 'DINE_IN', label: 'صالة' },
                { id: 'TAKEAWAY', label: 'سفري' },
                { id: 'DELIVERY', label: 'توصيل' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => updateFilter({ type: tab.id })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    filters.type === tab.id
                      ? 'bg-zinc-900 text-white shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Channel Pills */}
            <div className="flex items-center gap-1 bg-zinc-50 p-1 rounded-xl border border-zinc-200/70">
              <span className="text-[10px] text-zinc-400 font-bold px-1">القناة:</span>
              {[
                { id: 'ALL', label: 'الكل' },
                { id: 'POS', label: 'كاشير' },
                { id: 'ONLINE', label: 'أونلاين' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => updateFilter({ source: tab.id })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    filters.source === tab.id
                      ? 'bg-zinc-900 text-white shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Dropdowns - Responsive Grid on Mobile, Flex on Desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:items-center gap-2 w-full lg:w-auto">
            {/* Branch Select */}
            <select
              value={filters.branchId}
              disabled={isBranchRestricted}
              onChange={(e) => updateFilter({ branchId: e.target.value })}
              className="w-full lg:w-auto px-2.5 py-1.5 text-xs border border-zinc-200 rounded-xl bg-white font-medium text-zinc-800 focus:ring-1 focus:ring-zinc-800 outline-hidden cursor-pointer"
            >
              <option value="ALL">جميع الفروع</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nameAr}
                </option>
              ))}
            </select>

            {/* Cashier Select */}
            <select
              value={filters.cashierId}
              onChange={(e) => updateFilter({ cashierId: e.target.value })}
              className="w-full lg:w-auto px-2.5 py-1.5 text-xs border border-zinc-200 rounded-xl bg-white font-medium text-zinc-800 focus:ring-1 focus:ring-zinc-800 outline-hidden cursor-pointer"
            >
              <option value="ALL">جميع الكاشير</option>
              {cashiers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName}
                </option>
              ))}
            </select>

            {/* Payment Method Select */}
            <select
              value={filters.paymentMethod}
              onChange={(e) => updateFilter({ paymentMethod: e.target.value })}
              className="w-full lg:w-auto px-2.5 py-1.5 text-xs border border-zinc-200 rounded-xl bg-white font-medium text-zinc-800 focus:ring-1 focus:ring-zinc-800 outline-hidden cursor-pointer"
            >
              <option value="ALL">طرق الدفع</option>
              <option value="CASH">نقدي</option>
              <option value="CARD">بطاقة</option>
              <option value="MIXED">مختلط</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Invoices Audit Table (Stable, Fluid, Zero Layout Shift) */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xs overflow-hidden">
        <div
          className={`transition-opacity duration-200 ${
            isRefreshing ? 'opacity-60 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Mobile Feed Cards View (Visible on small screens: block md:hidden) */}
          <div className="md:hidden divide-y divide-zinc-100">
            {orders.length === 0 ? (
              <div className="py-12 px-4 text-center text-zinc-400">
                <Receipt className="w-9 h-9 mx-auto mb-2 text-zinc-300" />
                <p className="font-bold text-sm text-zinc-600">لا توجد فواتير مطابقة للشروط</p>
                <p className="text-xs text-zinc-400 mt-1">جرب تغيير شروط الفلترة أو إعادة ضبطها</p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition shadow-2xs cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>إعادة ضبط الفلاتر</span>
                  </button>
                )}
              </div>
            ) : (
              orders.map((order) => {
                const dateObj = new Date(order.createdAt);
                const dateText = dateObj.toLocaleDateString('ar-EG', {
                  month: 'short',
                  day: 'numeric',
                });
                const timeText = dateObj.toLocaleTimeString('ar-EG', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const totalItemCount = order.items.reduce((s, i) => s + i.quantity, 0);

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedInvoice(order)}
                    className="p-3.5 hover:bg-zinc-50 active:bg-zinc-100/60 transition cursor-pointer space-y-2.5"
                  >
                    {/* Top Row: Order # + Branch + Total */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono font-bold text-zinc-900 text-sm" dir="ltr">
                          #{order.orderNumber}
                        </span>
                        <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
                          {order.branch?.nameAr || 'الفرع الرئيسي'}
                        </p>
                      </div>
                      <div className="text-left">
                        <span className="font-mono font-black text-zinc-900 text-base">
                          {formatMoney(order.totalMinor)}
                        </span>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          {timeText} • {dateText}
                        </p>
                      </div>
                    </div>

                    {/* Middle Row: Badges (Type + Channel + Payment Status + Method) */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      {order.type === 'DINE_IN' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                          <Utensils className="w-3 h-3" />
                          <span>صالة {order.tableName ? `(${order.tableName})` : ''}</span>
                        </span>
                      ) : order.type === 'TAKEAWAY' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Store className="w-3 h-3" />
                          <span>سفري</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Bike className="w-3 h-3" />
                          <span>توصيل</span>
                        </span>
                      )}

                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-500 border border-zinc-200">
                        {order.source === 'POS' ? 'POS' : 'أونلاين'}
                      </span>

                      {order.paymentStatus === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>مدفوعة</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <Clock className="w-3 h-3" />
                          <span>شيك مفتوح</span>
                        </span>
                      )}

                      <span className="text-[11px] text-zinc-500 font-medium">
                        {order.paymentMethod === 'CASH'
                          ? 'نقدي'
                          : order.paymentMethod === 'CARD'
                          ? 'بطاقة'
                          : order.paymentMethod === 'MIXED'
                          ? 'مختلط'
                          : order.paymentMethod}
                      </span>
                    </div>

                    {/* Summary Row: Items & Cashier */}
                    <div className="flex items-center justify-between text-xs text-zinc-500 pt-1 border-t border-zinc-100">
                      <span className="truncate max-w-[200px]">
                        <strong className="text-zinc-700 font-semibold">{totalItemCount} صنف: </strong>
                        {order.items.slice(0, 2).map((i) => i.productNameAr).join('، ')}
                        {order.items.length > 2 && '...'}
                      </span>
                      <span className="text-[11px] text-zinc-400 shrink-0">
                        {order.cashier?.fullName || (order.source === 'ONLINE' ? 'الموقع' : '—')}
                      </span>
                    </div>

                    {/* Actions Row: 3 Touch Action Buttons */}
                    <div
                      className="flex items-center gap-2 pt-2 border-t border-zinc-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(order)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>معاينة</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrintThermal(order)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>فاتورة</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrintKot(order)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        <ChefHat className="w-3.5 h-3.5" />
                        <span>بون مطبخ</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop High-Density Table View (Visible on md and larger) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-zinc-50/90 border-b border-zinc-200 text-zinc-600 text-xs font-bold">
                  <th className="py-3.5 px-4 w-[17%]">الفاتورة والفرع</th>
                  <th className="py-3.5 px-3 w-[13%]">الوقت والتاريخ</th>
                  <th className="py-3.5 px-3 w-[18%]">النوع والقناة</th>
                  <th className="py-3.5 px-3 w-[13%]">الكاشير المسؤول</th>
                  <th className="py-3.5 px-3 w-[15%]">الأصناف</th>
                  <th className="py-3.5 px-3 w-[13%]">حالة وطريقة السداد</th>
                  <th className="py-3.5 px-3 w-[11%] text-left">الإجمالي</th>
                  <th className="py-3.5 px-3 w-[10%] text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs text-zinc-800 font-medium">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-zinc-400">
                      <Receipt className="w-9 h-9 mx-auto mb-2 text-zinc-300" />
                      <p className="font-bold text-sm text-zinc-600">لا توجد فواتير مطابقة للشروط المحددة</p>
                      <p className="text-xs text-zinc-400 mt-1">جرب تغيير شروط الفلترة أو إعادة ضبطها</p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition shadow-2xs cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>إعادة ضبط الفلاتر</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const dateObj = new Date(order.createdAt);
                    const dateText = dateObj.toLocaleDateString('ar-EG', {
                      month: 'short',
                      day: 'numeric',
                    });
                    const timeText = dateObj.toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    const totalItemCount = order.items.reduce((s, i) => s + i.quantity, 0);

                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-zinc-50/80 transition-colors group cursor-pointer"
                        onClick={() => setSelectedInvoice(order)}
                      >
                        {/* 1. Order Number & Branch */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span
                              className="font-mono font-bold text-zinc-900 group-hover:text-blue-600 transition text-sm"
                              dir="ltr"
                            >
                              #{order.orderNumber}
                            </span>
                            <span className="text-[11px] text-zinc-400 font-medium">
                              {order.branch?.nameAr || 'الفرع الرئيسي'}
                            </span>
                          </div>
                        </td>

                        {/* 2. Date & Time */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-mono text-zinc-800 font-semibold text-xs">{timeText}</span>
                            <span className="text-zinc-400 text-[10px]">{dateText}</span>
                          </div>
                        </td>

                        {/* 3. Type & Channel Badge */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {order.type === 'DINE_IN' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                <Utensils className="w-3 h-3" />
                                <span>صالة {order.tableName ? `(${order.tableName})` : ''}</span>
                              </span>
                            ) : order.type === 'TAKEAWAY' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Store className="w-3 h-3" />
                                <span>سفري</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                <Bike className="w-3 h-3" />
                                <span>توصيل</span>
                              </span>
                            )}

                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-500 border border-zinc-200">
                              {order.source === 'POS' ? 'POS' : 'أونلاين'}
                            </span>
                          </div>
                        </td>

                        {/* 4. Cashier / Staff */}
                        <td className="py-3.5 px-3 text-zinc-600 whitespace-nowrap font-medium text-xs">
                          {order.cashier?.fullName || (order.source === 'ONLINE' ? 'الموقع العام' : '—')}
                        </td>

                        {/* 5. Items Summary */}
                        <td className="py-3.5 px-3 text-zinc-600">
                          <div className="flex items-center gap-1.5 max-w-[170px]">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 font-bold font-mono text-[10px] shrink-0">
                              {totalItemCount} صنف
                            </span>
                            <span
                              className="text-zinc-700 text-xs truncate"
                              title={order.items.map((i) => i.productNameAr).join('، ')}
                            >
                              {order.items
                                .slice(0, 2)
                                .map((i) => i.productNameAr)
                                .join('، ')}
                              {order.items.length > 2 && '...'}
                            </span>
                          </div>
                        </td>

                        {/* 6. Payment Status & Method */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {order.paymentStatus === 'PAID' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>مدفوعة</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <Clock className="w-3 h-3" />
                                <span>شيك مفتوح</span>
                              </span>
                            )}

                            <span className="text-[11px] text-zinc-500 font-medium">
                              {order.paymentMethod === 'CASH'
                                ? 'نقدي'
                                : order.paymentMethod === 'CARD'
                                ? 'بطاقة'
                                : order.paymentMethod === 'MIXED'
                                ? 'مختلط'
                                : order.paymentMethod}
                            </span>
                          </div>
                        </td>

                        {/* 7. Total Amount */}
                        <td className="py-3.5 px-3 text-left font-black font-mono text-zinc-900 text-sm whitespace-nowrap">
                          {formatMoney(order.totalMinor)}
                        </td>

                        {/* 8. Quick Actions */}
                        <td
                          className="py-3.5 px-3 text-center whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedInvoice(order)}
                              title="تدقيق تفاصيل الفاتورة"
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrintThermal(order)}
                              title="طباعة إيصال الفاتورة 80mm"
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrintKot(order)}
                              title="طباعة بون المطبخ KOT"
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
                            >
                              <ChefHat className="w-4 h-4" />
                            </button>
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

        {/* 5. Pagination Bar */}
        {totalCount > 0 && (
          <div className="p-3 sm:p-4 border-t border-zinc-100 bg-zinc-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600 font-medium">
            <div>
              <span>عرض </span>
              <strong className="text-zinc-900 font-mono">
                {(currentPage - 1) * pageSize + 1}
              </strong>
              <span> إلى </span>
              <strong className="text-zinc-900 font-mono">
                {Math.min(currentPage * pageSize, totalCount)}
              </strong>
              <span> من أصل </span>
              <strong className="text-zinc-900 font-mono">{totalCount}</strong>
              <span> فاتورة</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1 || isRefreshing}
                onClick={() => handlePageChange(currentPage - 1)}
                className="flex items-center gap-1 px-2.5 py-1.5 border border-zinc-200 rounded-lg bg-white text-zinc-700 hover:bg-zinc-100 transition cursor-pointer disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                <span>السابق</span>
              </button>

              <div className="flex items-center gap-1 px-2 font-mono text-xs">
                <span>صفحة </span>
                <span className="font-bold text-zinc-900">{currentPage}</span>
                <span> من </span>
                <span className="font-bold text-zinc-900">{totalPages}</span>
              </div>

              <button
                type="button"
                disabled={currentPage >= totalPages || isRefreshing}
                onClick={() => handlePageChange(currentPage + 1)}
                className="flex items-center gap-1 px-2.5 py-1.5 border border-zinc-200 rounded-lg bg-white text-zinc-700 hover:bg-zinc-100 transition cursor-pointer disabled:opacity-40"
              >
                <span>التالي</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="ms-2 flex items-center gap-1 border-s border-zinc-200 ps-2">
                <span className="text-[11px] text-zinc-400">العدد:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-2 py-1 border border-zinc-200 rounded-lg bg-white text-xs font-semibold text-zinc-700 outline-hidden focus:ring-1 focus:ring-zinc-800 cursor-pointer"
                >
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. Detailed Invoice Audit Modal */}
      {selectedInvoice && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setSelectedInvoice(null)}
        >
          <div
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-zinc-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-zinc-900 text-white shadow-xs">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-zinc-900">
                      فاتورة #{selectedInvoice.orderNumber}
                    </h3>
                    {selectedInvoice.paymentStatus === 'PAID' ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        مسددة بالكامل
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                        شيك مفتوح / معلق
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">
                    {new Date(selectedInvoice.createdAt).toLocaleString('ar-EG', {
                      dateStyle: 'full',
                      timeStyle: 'medium',
                    })}
                  </span>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintThermal(selectedInvoice)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 transition shadow-2xs cursor-pointer"
                  title="طباعة إيصال الفاتورة الحراري"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة فاتورة</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintKot(selectedInvoice)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 transition shadow-2xs cursor-pointer"
                  title="طباعة بون المطبخ"
                >
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>بون المطبخ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Scrollable Audit Details */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-zinc-50 border border-zinc-100 text-xs">
                <div>
                  <span className="text-zinc-400 block text-[11px]">الفرع</span>
                  <span className="font-bold text-zinc-800 mt-0.5 block">
                    {selectedInvoice.branch?.nameAr || 'الفرع الرئيسي'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[11px]">الكاشير المسؤول</span>
                  <span className="font-bold text-zinc-800 mt-0.5 block">
                    {selectedInvoice.cashier?.fullName || 'الموقع العام'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[11px]">نوع الطلب والقناة</span>
                  <span className="font-bold text-zinc-800 mt-0.5 block">
                    {selectedInvoice.type === 'DINE_IN'
                      ? `صالة (${selectedInvoice.tableName || 'طاولة'})`
                      : selectedInvoice.type === 'TAKEAWAY'
                      ? 'سفري'
                      : 'توصيل'}
                    {' • '}
                    {selectedInvoice.source === 'POS' ? 'كاشير' : 'الموقع'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[11px]">طريقة السداد</span>
                  <span className="font-bold text-zinc-800 mt-0.5 block">
                    {selectedInvoice.paymentMethod === 'CASH'
                      ? 'نقدي'
                      : selectedInvoice.paymentMethod === 'CARD'
                      ? 'بطاقة دفع'
                      : selectedInvoice.paymentMethod === 'MIXED'
                      ? 'دفع مختلط'
                      : selectedInvoice.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div>
                <h4 className="text-xs font-bold text-zinc-900 mb-2.5">تفاصيل الأصناف والكميات</h4>
                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-zinc-50 text-zinc-500 font-bold border-b border-zinc-200">
                      <tr>
                        <th className="py-2.5 px-3">الصنف والمقاس</th>
                        <th className="py-2.5 px-3 text-center">الكمية</th>
                        <th className="py-2.5 px-3 text-left">سعر الوحدة</th>
                        <th className="py-2.5 px-3 text-left">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {selectedInvoice.items.map((item) => (
                        <tr key={item.id} className="hover:bg-zinc-50/50">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-zinc-900">{item.productNameAr}</span>
                            {item.sizeNameAr && (
                              <span className="text-zinc-400 mr-1.5">({item.sizeNameAr})</span>
                            )}
                            {item.modifiers.length > 0 && (
                              <div className="text-[11px] text-zinc-500 mt-0.5 space-y-0.5">
                                {item.modifiers.map((m) => (
                                  <div key={m.id}>
                                    + {m.nameAr}{' '}
                                    {m.priceDeltaMinor > 0 && `(${formatMoney(m.priceDeltaMinor)})`}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold font-mono">
                            {item.quantity}×
                          </td>
                          <td className="py-2.5 px-3 text-left font-mono text-zinc-600">
                            {formatMoney(item.unitPriceMinor)}
                          </td>
                          <td className="py-2.5 px-3 text-left font-bold font-mono text-zinc-900">
                            {formatMoney(item.totalPriceMinor)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payments & Financial Totals Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Payments Log */}
                <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-2">
                  <span className="text-xs font-bold text-zinc-900 block">سجل الدفعات المحصلة</span>
                  {selectedInvoice.payments && selectedInvoice.payments.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedInvoice.payments.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-zinc-200"
                        >
                          <div className="flex items-center gap-1.5">
                            {p.method === 'CASH' ? (
                              <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                            )}
                            <span className="font-medium text-zinc-800">
                              {p.method === 'CASH' ? 'نقدي' : 'بطاقة'}
                            </span>
                          </div>
                          <span className="font-bold font-mono text-zinc-900">
                            {formatMoney(p.amountMinor)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">
                      {selectedInvoice.paymentStatus === 'PAID'
                        ? 'تم التحصيل بالكامل عند إغلاق الفاتورة'
                        : 'لم يتم تسجيل دفعات بعد (شيك مفتوح)'}
                    </p>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50 space-y-1.5 text-xs">
                  <div className="flex justify-between text-zinc-600">
                    <span>المجموع الفرعي:</span>
                    <span className="font-mono">{formatMoney(selectedInvoice.subtotalMinor)}</span>
                  </div>
                  {selectedInvoice.deliveryFeeMinor > 0 && (
                    <div className="flex justify-between text-zinc-600">
                      <span>رسوم التوصيل:</span>
                      <span className="font-mono">{formatMoney(selectedInvoice.deliveryFeeMinor)}</span>
                    </div>
                  )}
                  {selectedInvoice.taxMinor > 0 && (
                    <div className="flex justify-between text-zinc-600">
                      <span>ضريبة القيمة المضافة:</span>
                      <span className="font-mono">{formatMoney(selectedInvoice.taxMinor)}</span>
                    </div>
                  )}
                  {selectedInvoice.discountMinor > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>الخصم المطبق:</span>
                      <span className="font-mono">-{formatMoney(selectedInvoice.discountMinor)}</span>
                    </div>
                  )}
                  <div className="border-t border-zinc-200 pt-2 mt-2 flex justify-between font-black text-sm text-zinc-900">
                    <span>الإجمالي النهائي:</span>
                    <span className="font-mono text-base text-emerald-600">
                      {formatMoney(selectedInvoice.totalMinor)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-zinc-50 border-t border-zinc-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
