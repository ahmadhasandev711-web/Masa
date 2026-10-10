'use client';

import { useState, useEffect } from 'react';
import { OrderType } from '../../../domain/ordering/enums';
import { PosProduct, PosReceipt, PosSelection } from '../../../domain/pos/contracts/pos.repository';
import { PosPaymentMode } from '../../../domain/pos/enums';
import { PosSaleService } from '../../../domain/pos/services/pos-sale.service';
import { PosSettlementService } from '../../../domain/pos/services/pos-settlement.service';
import { Money } from '../../../domain/shared/value-objects/money';
import { PosClientProps, PosSection } from './pos.types';
import { usePosSale } from './use-pos-sale';
import { BrowserReceiptPrinter } from '../../../infrastructure/pos/browser-receipt-printer';
import { TableItemView } from '../../../application/tables/use-cases/list-tables.use-case';
import {
  listTablesAction,
  openTableTabAction,
  addItemsToTabAction,
  transferTableAction,
  printTableBillAction,
  closeTableTabAction,
} from '../../actions/table.actions';
import { PosOfflineQueue } from '../../../infrastructure/pos/pos-offline-queue';
import { usePosOfflineSync } from './use-pos-offline-sync';

function usePosDraft() {
  const [items, setItems] = useState<PosSelection[]>([]);
  const [product, setProduct] = useState<PosProduct | null>(null);
  const [type, setType] = useState<OrderType.DINE_IN | OrderType.TAKEAWAY>(OrderType.TAKEAWAY);
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('');
  const [mode, setMode] = useState(PosPaymentMode.CASH);
  const [cash, setCash] = useState('');

  // Table Draft State
  const [selectedTable, setSelectedTable] = useState<TableItemView | null>(null);
  const [guestCount, setGuestCount] = useState<number>(2);
  const [activeTabOrderId, setActiveTabOrderId] = useState<string | null>(null);

  function changeQuantity(index: number, delta: number) {
    setItems((current) =>
      current.flatMap((item, position) =>
        position !== index
          ? [item]
          : item.quantity + delta <= 0
          ? []
          : [{ ...item, quantity: Math.min(99, item.quantity + delta) }]
      )
    );
  }

  function add(selection: PosSelection) {
    const key = (item: PosSelection) =>
      item.productId + item.sizeId + item.modifierIds.slice().sort().join(',');
    const index = items.findIndex((item) => key(item) === key(selection));
    if (index >= 0) changeQuantity(index, 1);
    else setItems([...items, selection]);
  }

  function clear() {
    setItems([]);
    setDiscount('0');
    setCash('');
    setNotes('');
    setSelectedTable(null);
    setGuestCount(2);
    setActiveTabOrderId(null);
  }

  const handleSetType = (nextType: OrderType.DINE_IN | OrderType.TAKEAWAY) => {
    setType(nextType);
    if (nextType === OrderType.TAKEAWAY) {
      setSelectedTable(null);
      setActiveTabOrderId(null);
    }
  };

  return {
    items,
    product,
    setProduct,
    type,
    setType: handleSetType,
    discount,
    setDiscount,
    notes,
    setNotes,
    mode,
    setMode,
    cash,
    setCash,
    selectedTable,
    setSelectedTable,
    guestCount,
    setGuestCount,
    activeTabOrderId,
    setActiveTabOrderId,
    changeQuantity,
    add,
    clear,
  };
}

function usePosReceipts(
  initial: PosReceipt[],
  onSuccess: (receipt: PosReceipt) => void,
  onQueueUpdate?: () => void
) {
  const [receipts, setReceipts] = useState(initial);
  const [printedReceipt, setPrintedReceipt] = useState<PosReceipt | null>(null);
  const [lastCompletedReceipt, setLastCompletedReceipt] = useState<PosReceipt | null>(null);

  function print(receipt: PosReceipt) {
    setPrintedReceipt(receipt);
    new BrowserReceiptPrinter().print();
  }

  const sale = usePosSale((receipt) => {
    setReceipts((current) =>
      [receipt, ...current.filter((old) => old.id !== receipt.id)].slice(0, 20)
    );
    setLastCompletedReceipt(receipt);
    onSuccess(receipt);
  }, onQueueUpdate);

  return { receipts, printedReceipt, setPrintedReceipt, lastCompletedReceipt, setLastCompletedReceipt, print, sale };
}

function estimate(
  draft: ReturnType<typeof usePosDraft>,
  products: PosProduct[],
  props: PosClientProps
) {
  if (!draft.items.length) return { totals: null, pricingError: '' };
  try {
    const lines = draft.items.map((item) =>
      PosSaleService.resolveLine(item, products, props.settings.currency)
    );
    return {
      totals: PosSaleService.price(
        lines,
        props.settings,
        Money.fromDecimal(draft.discount || '0', props.settings.currency).amount
      ),
      pricingError: '',
    };
  } catch (error) {
    return { totals: null, pricingError: error instanceof Error ? error.message : 'تحقق من السلة' };
  }
}

export function usePosWorkspace(props: PosClientProps) {
  const draft = usePosDraft();
  const offlineSync = usePosOfflineSync();
  const [shift, setShift] = useState(props.initialShift);
  const [notice, setNotice] = useState('');
  const [showShift, setShowShift] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Dine-In & Tables Management Workspace State
  const [viewMode, setViewMode] = useState<'SALE' | 'FLOOR_PLAN'>('SALE');
  const [tables, setTables] = useState<TableItemView[]>(props.initialTables);
  const [sections, setSections] = useState<PosSection[]>(props.initialSections);
  const [isTablePickerOpen, setIsTablePickerOpen] = useState(false);
  const [activeTabModalTable, setActiveTabModalTable] = useState<TableItemView | null>(null);
  const [isRefreshingTables, setIsRefreshingTables] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const receiptState = usePosReceipts(
    props.initialReceipts,
    (receipt) => {
      draft.clear();
      setIsPaymentModalOpen(false);
      setNotice('تم البيع بنجاح. رقم الفاتورة: ' + receipt.orderNumber);
    },
    offlineSync.refreshQueue
  );

  const products = props.categories.flatMap((category) => category.products);
  const { totals, pricingError } = estimate(draft, products, props);

  // Cache catalog, settings, and shift for offline resilience
  useEffect(() => {
    PosOfflineQueue.cacheCatalog(props.categories);
    PosOfflineQueue.cacheSettings(props.settings);
    PosOfflineQueue.cacheActiveShift(shift);
  }, [props.categories, props.settings, shift]);

  // Refresh tables and sections from server
  const refreshTables = async () => {
    setIsRefreshingTables(true);
    try {
      const res = await listTablesAction(props.branch.id);
      if (res.success) {
        setTables(res.data.tables);
        setSections(res.data.sections);
      }
    } finally {
      setIsRefreshingTables(false);
    }
  };

  // Immediate POS Sale Checkout
  function checkout() {
    receiptState.sale.submit(
      () => {
        if (!shift || !totals) throw new Error('افتح وردية وأضف أصنافاً صحيحة أولاً');
        const total = Money.fromMinor(totals.totalMinor, props.settings.currency);
        const tendered = draft.cash ? Money.fromDecimal(draft.cash, props.settings.currency) : total;
        const { payments } = PosSettlementService.payments(draft.mode, total, tendered);
        return {
          branchId: props.branch.id,
          cashShiftId: shift.id,
          idempotencyKey: crypto.randomUUID(),
          type: draft.type,
          discountMinor: totals.discountMinor,
          customerNotes: draft.notes.trim() || undefined,
          items: draft.items,
          payments,
        };
      },
      () => {
        if (!totals) throw new Error('بيانات الحساب غير متوفرة');
        const lines = draft.items.map((item) =>
          PosSaleService.resolveLine(item, products, props.settings.currency)
        );
        return {
          branchName: props.branch.nameAr,
          cashierId: shift?.id ?? 'offline-cashier',
          currency: props.settings.currency,
          locale: props.settings.locale,
          totals,
          lines,
        };
      }
    );
  }

  // Open a new Tab on Table
  async function openTableTab(tableId: string, guests: number, initialItems?: PosSelection[]) {
    if (!shift) {
      setNotice('يرجى فتح وردية كاشير أولاً قبل فتح الطاولات');
      setShowShift(true);
      return false;
    }
    const res = await openTableTabAction({
      branchId: props.branch.id,
      tableId,
      cashShiftId: shift.id,
      cashierId: '',
      guestCount: guests,
      customerNotes: draft.notes.trim() || undefined,
      items: initialItems ?? draft.items,
    });
    if (res.success) {
      draft.clear();
      setIsPaymentModalOpen(false);
      await refreshTables();
      setViewMode('FLOOR_PLAN');
      setNotice(`تم فتح طاولة ${res.data.table.tableNumber} بنجاح`);
      return true;
    } else {
      setNotice(`تعذر فتح الطاولة: ${res.error}`);
      return false;
    }
  }

  // Append items to an already open Tab
  async function addItemsToTab(orderId: string) {
    if (!draft.items.length) {
      setNotice('أضف أصنافاً للسلة أولاً قبل إرسالها للطاولة');
      return false;
    }
    const res = await addItemsToTabAction({
      orderId,
      items: draft.items,
    });
    if (res.success) {
      draft.clear();
      setIsPaymentModalOpen(false);
      await refreshTables();
      setViewMode('FLOOR_PLAN');
      setNotice('تمت إضافة الأصناف للطلب المفتوح بنجاح');
      return true;
    } else {
      setNotice(`تعذر إضافة الأصناف: ${res.error}`);
      return false;
    }
  }

  // Transfer Table
  async function transferTable(fromTableId: string, toTableId: string) {
    const res = await transferTableAction({
      fromTableId,
      toTableId,
    });
    if (res.success) {
      await refreshTables();
      setNotice(`تم نقل الطلب إلى طاولة ${res.data.toTable.tableNumber} بنجاح`);
      return true;
    } else {
      setNotice(`تعذر نقل الطاولة: ${res.error}`);
      return false;
    }
  }

  // Print 80mm Table Bill
  async function printTableBill(tableId: string) {
    const res = await printTableBillAction({ tableId });
    if (res.success) {
      await refreshTables();
      setNotice('تم إصدار شيك الحساب بنجاح');
      return res.data;
    } else {
      setNotice(`تعذر طباعة الشيك: ${res.error}`);
      return null;
    }
  }

  // Close and Settle Tab
  async function closeTableTab(
    tableId: string,
    orderId: string,
    paymentMethod: 'CASH' | 'CARD' | 'MIXED',
    payments?: Array<{ method: 'CASH' | 'CARD'; amountMinor: number }>
  ) {
    if (!shift) {
      setNotice('لا توجد وردية نشطة لإتمام التحصيل');
      return false;
    }
    const res = await closeTableTabAction({
      tableId,
      orderId,
      cashShiftId: shift.id,
      cashierId: '',
      paymentMethod,
      payments,
    });
    if (res.success) {
      await refreshTables();
      setNotice(`تم تحصيل الطلب ${res.data.order.orderNumber} وتحرير الطاولة بنجاح`);
      return true;
    } else {
      setNotice(`تعذر التحصيل: ${res.error}`);
      return false;
    }
  }

  return {
    ...props,
    ...draft,
    ...receiptState,
    shift,
    setShift,
    notice,
    setNotice,
    showShift,
    setShowShift,
    showHistory,
    setShowHistory,
    products,
    totals,
    pricingError,
    checkout,
    isPaymentModalOpen,
    setIsPaymentModalOpen,

    // Tables state & actions
    viewMode,
    setViewMode,
    tables,
    sections,
    isTablePickerOpen,
    setIsTablePickerOpen,
    activeTabModalTable,
    setActiveTabModalTable,
    isRefreshingTables,
    refreshTables,
    openTableTab,
    addItemsToTab,
    transferTable,
    printTableBill,
    closeTableTab,

    // Offline Resilience & Sync
    offlineSync,
  };
}

export type PosWorkspace = ReturnType<typeof usePosWorkspace>;
