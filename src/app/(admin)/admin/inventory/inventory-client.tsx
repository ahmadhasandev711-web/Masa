'use client';

import React, { useState } from 'react';
import {
  Package,
  BookOpen,
  Truck,
  ArrowUpDown,
  Plus,
  Search,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Edit2,
  Check,
  Loader2,
  Boxes,
  CookingPot,
} from 'lucide-react';
import { InventoryPageData, CatalogProductForRecipe } from './inventory.types';
import {
  InventoryMovementType,
  MOVEMENT_TYPE_LABELS,
  PurchaseOrderStatus,
} from '../../../../domain/inventory/enums';
import {
  BranchStockItemDto,
  InventoryItemDto,
  SupplierDto,
} from '../../../../domain/inventory/contracts/inventory.repository';
import { ItemModal } from './components/item-modal';
import { AdjustmentModal } from './components/adjustment-modal';
import { RecipeEditorModal } from './components/recipe-editor-modal';
import { SupplierModal } from './components/supplier-modal';
import { PurchaseOrderModal } from './components/purchase-order-modal';
import { receivePurchaseOrderAction } from '../../../actions/inventory.actions';
import { useRouter } from 'next/navigation';

export function InventoryClient({ initialData }: { initialData: InventoryPageData }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'stock' | 'recipes' | 'purchases' | 'movements'>('stock');

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItemDto | null>(null);

  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedStockForAdjustment, setSelectedStockForAdjustment] = useState<BranchStockItemDto | null>(null);
  const [adjustmentDefaultType, setAdjustmentDefaultType] = useState<InventoryMovementType>(
    InventoryMovementType.OPERATIONAL_CONSUMPTION
  );

  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [selectedProductForRecipe, setSelectedProductForRecipe] = useState<CatalogProductForRecipe | null>(null);

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<SupplierDto | null>(null);

  const [isPurchaseOrderModalOpen, setIsPurchaseOrderModalOpen] = useState(false);

  const [receivingOrderId, setReceivingOrderId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Search & Filters
  const [stockSearch, setStockSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'NEGATIVE'>('ALL');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('ALL');

  const refreshData = () => {
    router.refresh();
  };

  // KPIs
  const totalItemsCount = initialData.stock.length;
  const lowStockCount = initialData.stock.filter((s) => s.isLowStock && !s.isNegative).length;
  const negativeStockCount = initialData.stock.filter((s) => s.isNegative).length;
  const totalInventoryValueMinor = initialData.stock.reduce(
    (acc, s) => acc + (s.quantity > 0 ? s.quantity * s.defaultCostMinor : 0),
    0
  );

  // Filtered Stock
  const [stockPage, setStockPage] = useState(1);
  const [stockPageSize, setStockPageSize] = useState(20);

  const filteredStock = initialData.stock.filter((s) => {
    const matchesSearch =
      s.nameAr.toLowerCase().includes(stockSearch.toLowerCase()) ||
      s.nameEn.toLowerCase().includes(stockSearch.toLowerCase()) ||
      (s.sku && s.sku.toLowerCase().includes(stockSearch.toLowerCase()));
    if (!matchesSearch) return false;

    if (stockFilter === 'LOW') return s.isLowStock;
    if (stockFilter === 'NEGATIVE') return s.isNegative;
    return true;
  });

  const totalStockFiltered = filteredStock.length;
  const totalStockPages = Math.max(1, Math.ceil(totalStockFiltered / stockPageSize));
  const validStockPage = Math.min(stockPage, totalStockPages);
  const paginatedStock = filteredStock.slice(
    (validStockPage - 1) * stockPageSize,
    validStockPage * stockPageSize
  );

  // Filtered Recipes Products
  const filteredProducts = initialData.catalogProducts.filter((p) => {
    return (
      p.nameAr.toLowerCase().includes(recipeSearch.toLowerCase()) ||
      p.nameEn.toLowerCase().includes(recipeSearch.toLowerCase()) ||
      p.categoryNameAr.toLowerCase().includes(recipeSearch.toLowerCase())
    );
  });

  // Filtered Movements
  const [movementsPage, setMovementsPage] = useState(1);
  const [movementsPageSize, setMovementsPageSize] = useState(20);

  const filteredMovements = initialData.movements.filter((m) => {
    if (movementTypeFilter === 'ALL') return true;
    return m.type === movementTypeFilter;
  });

  const totalMovementsFiltered = filteredMovements.length;
  const totalMovementsPages = Math.max(1, Math.ceil(totalMovementsFiltered / movementsPageSize));
  const validMovementsPage = Math.min(movementsPage, totalMovementsPages);
  const paginatedMovements = filteredMovements.slice(
    (validMovementsPage - 1) * movementsPageSize,
    validMovementsPage * movementsPageSize
  );

  const handleReceiveOrder = async (orderId: string) => {
    setReceivingOrderId(orderId);
    setActionError(null);
    const res = await receivePurchaseOrderAction(orderId);
    setReceivingOrderId(null);
    if (!res.success) {
      setActionError(res.error || 'فشل استلام أمر الشراء');
      return;
    }
    refreshData();
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header with Title and Branch indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-zinc-800" strokeWidth={1.75} />
            <span>المخزون والوصفات والمشتريات</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            الفرع النشط: <span className="font-semibold text-zinc-800">{initialData.branchName}</span> • إدارة بطاقات المواد الخام، وصفات الأطباق (BOM)، وأوامر التوريد
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedStockForAdjustment(null);
              setAdjustmentDefaultType(InventoryMovementType.OPERATIONAL_CONSUMPTION);
              setIsAdjustmentModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-lg border border-zinc-300 transition-colors"
          >
            <CookingPot className="w-4 h-4 text-zinc-700" strokeWidth={1.75} />
            <span>صرف تشغيل للمطبخ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setItemToEdit(null);
              setIsItemModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مكون خام</span>
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex border-b border-zinc-200 gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('stock')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'stock'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <Boxes className="w-4 h-4" strokeWidth={1.75} />
          <span>المخزون والأرصدة</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-zinc-100 text-zinc-700 font-mono">
            {initialData.stock.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('recipes')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'recipes'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <BookOpen className="w-4 h-4" strokeWidth={1.75} />
          <span>وصفات الأطباق (BOM)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-zinc-100 text-zinc-700 font-mono">
            {initialData.catalogProducts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('purchases')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'purchases'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <Truck className="w-4 h-4" strokeWidth={1.75} />
          <span>الموردين وأوامر الشراء</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-zinc-100 text-zinc-700 font-mono">
            {initialData.purchaseOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('movements')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'movements'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <ArrowUpDown className="w-4 h-4" strokeWidth={1.75} />
          <span>سجل حركات المخزون</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-zinc-100 text-zinc-700 font-mono">
            {initialData.movements.length}
          </span>
        </button>
      </div>

      {/* TAB 1: Stock & Balances */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-white border border-zinc-200 rounded-xl">
              <span className="text-xs text-zinc-500">إجمالي المكونات المسجلة</span>
              <p className="text-xl font-bold font-mono text-zinc-900 mt-1">{totalItemsCount}</p>
            </div>
            <div className="p-3 bg-white border border-zinc-200 rounded-xl">
              <span className="text-xs text-amber-700">مواد قاربت على النفاد</span>
              <p className="text-xl font-bold font-mono text-amber-700 mt-1">{lowStockCount}</p>
            </div>
            <div className="p-3 bg-white border border-zinc-200 rounded-xl">
              <span className="text-xs text-rose-700">رصيد سالب (عجز تشغيلي)</span>
              <p className="text-xl font-bold font-mono text-rose-700 mt-1">{negativeStockCount}</p>
            </div>
            <div className="p-3 bg-white border border-zinc-200 rounded-xl">
              <span className="text-xs text-zinc-500">قيمة المخزون التقديرية</span>
              <p className="text-xl font-bold font-mono text-zinc-900 mt-1">
                {(totalInventoryValueMinor / 100).toFixed(2)} {initialData.currency}
              </p>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 border border-zinc-200 rounded-xl">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                value={stockSearch}
                onChange={(e) => {
                  setStockSearch(e.target.value);
                  setStockPage(1);
                }}
                placeholder="بحث باسم المكون أو الكود..."
                className="w-full text-xs pr-9 pl-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 focus:outline-hidden focus:border-zinc-800"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => {
                  setStockFilter('ALL');
                  setStockPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  stockFilter === 'ALL'
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                الكل ({initialData.stock.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStockFilter('LOW');
                  setStockPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  stockFilter === 'LOW'
                    ? 'bg-amber-700 text-white border-amber-700'
                    : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
                }`}
              >
                النواقص ({lowStockCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStockFilter('NEGATIVE');
                  setStockPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  stockFilter === 'NEGATIVE'
                    ? 'bg-rose-700 text-white border-rose-700'
                    : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-50'
                }`}
              >
                الرصيد السالب ({negativeStockCount})
              </button>
            </div>
          </div>

          {/* Stock Table */}
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold">
                  <tr>
                    <th className="p-3">الكود</th>
                    <th className="p-3">المكون الخام</th>
                    <th className="p-3">وحدة القياس</th>
                    <th className="p-3">الرصيد في الفرع</th>
                    <th className="p-3">حد النواقص</th>
                    <th className="p-3">الحالة التشغيلية</th>
                    <th className="p-3">تكلفة الشراء</th>
                    <th className="p-3 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredStock.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-zinc-400">
                        لا توجد مكونات تطابق معايير البحث.
                      </td>
                    </tr>
                  ) : (
                    paginatedStock.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="p-3 font-mono text-zinc-500">{item.sku || '—'}</td>
                        <td className="p-3 font-semibold text-zinc-900">
                          <div>{item.nameAr}</div>
                          <div className="text-[10px] text-zinc-400 font-mono">{item.nameEn}</div>
                        </td>
                        <td className="p-3 text-zinc-600">{item.unit}</td>
                        <td className="p-3 font-mono text-sm font-bold">
                          <span
                            className={
                              item.isNegative
                                ? 'text-rose-600'
                                : item.isLowStock
                                ? 'text-amber-700'
                                : 'text-zinc-900'
                            }
                          >
                            {item.quantity.toFixed(3)}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-zinc-500">{item.minThreshold.toFixed(3)}</td>
                        <td className="p-3">
                          {item.isNegative ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertOctagon className="w-3 h-3" />
                              <span>رصيد سالب (عجز)</span>
                            </span>
                          ) : item.isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertTriangle className="w-3 h-3" />
                              <span>قارب على النفاد</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>رصيد كافٍ</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-zinc-700">
                          {(item.defaultCostMinor / 100).toFixed(2)} {initialData.currency}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStockForAdjustment(item);
                                setAdjustmentDefaultType(InventoryMovementType.OPERATIONAL_CONSUMPTION);
                                setIsAdjustmentModalOpen(true);
                              }}
                              className="px-2 py-1 text-[11px] font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors"
                              title="صرف تشغيل للمطبخ"
                            >
                              صرف
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStockForAdjustment(item);
                                setAdjustmentDefaultType(InventoryMovementType.ADJUSTMENT);
                                setIsAdjustmentModalOpen(true);
                              }}
                              className="px-2 py-1 text-[11px] font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors"
                              title="تسوية جردية أو توالف"
                            >
                              تسوية
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setItemToEdit(item);
                                setIsItemModalOpen(true);
                              }}
                              className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
                              title="تعديل المكون"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Stock Pagination Footer */}
            {totalStockFiltered > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/50 px-4 py-3 text-xs text-zinc-600">
                <div className="flex items-center gap-2">
                  <span>
                    عرض {Math.min((validStockPage - 1) * stockPageSize + 1, totalStockFiltered)} إلى{' '}
                    {Math.min(validStockPage * stockPageSize, totalStockFiltered)} من أصل {totalStockFiltered} مكوّن
                  </span>
                  <span className="text-zinc-300">|</span>
                  <label className="flex items-center gap-1.5 text-zinc-500">
                    <span>لكل صفحة:</span>
                    <select
                      value={stockPageSize}
                      onChange={(e) => {
                        setStockPageSize(Number(e.target.value));
                        setStockPage(1);
                      }}
                      className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-800"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </label>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStockPage((p) => Math.max(1, p - 1))}
                    disabled={validStockPage <= 1}
                    className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 font-medium hover:bg-zinc-100 disabled:opacity-40 transition"
                  >
                    السابق
                  </button>
                  <span className="px-2 font-medium">
                    صفحة {validStockPage} من {totalStockPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStockPage((p) => Math.min(totalStockPages, p + 1))}
                    disabled={validStockPage >= totalStockPages}
                    className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 font-medium hover:bg-zinc-100 disabled:opacity-40 transition"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BOM Recipes */}
      {activeTab === 'recipes' && (
        <div className="space-y-4">
          <div className="bg-white p-3 border border-zinc-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                value={recipeSearch}
                onChange={(e) => setRecipeSearch(e.target.value)}
                placeholder="بحث في الأصناف أو التصنيفات..."
                className="w-full text-xs pr-9 pl-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 focus:outline-hidden focus:border-zinc-800"
              />
            </div>
            <div className="text-xs text-zinc-500">
              الوصفات اختيارية بالكامل. الأصناف بدون وصفة تُباع مباشرة بالـ POS دون خصم للمكونات.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProducts.map((prod) => {
              const productRecipes = initialData.recipes[prod.id] ?? [];
              const hasRecipe = productRecipes.length > 0;

              return (
                <div
                  key={prod.id}
                  className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-xs transition-shadow"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-zinc-900 text-sm">{prod.nameAr}</h4>
                        <span className="text-[11px] text-zinc-400 font-mono">{prod.nameEn}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-medium">
                        {prod.categoryNameAr}
                      </span>
                    </div>

                    <div className="pt-2">
                      {hasRecipe ? (
                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                            مرتبط بوصفة ({productRecipes.length} مكون)
                          </span>
                          <ul className="text-xs text-zinc-600 divide-y divide-zinc-100 pt-1">
                            {productRecipes.slice(0, 3).map((r) => (
                              <li key={r.id} className="py-1 flex justify-between">
                                <span>{r.inventoryItemNameAr}</span>
                                <span className="font-mono text-zinc-500">
                                  {r.quantity} {r.unit}
                                </span>
                              </li>
                            ))}
                            {productRecipes.length > 3 && (
                              <li className="text-[10px] text-zinc-400 pt-1">
                                + {productRecipes.length - 3} مكونات أخرى
                              </li>
                            )}
                          </ul>
                        </div>
                      ) : (
                        <div className="py-2">
                          <span className="text-[10px] font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full inline-block">
                            تشغيل مباشر بلا وصفة (اختياري)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProductForRecipe(prod);
                        setIsRecipeModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors border border-zinc-200"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{hasRecipe ? 'تعديل الوصفة' : 'إنشاء وصفة للطبق'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Suppliers & Purchases */}
      {activeTab === 'purchases' && (
        <div className="space-y-6">
          {/* Top Bar for Purchases */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 border border-zinc-200 rounded-xl">
            <div>
              <h3 className="font-bold text-sm text-zinc-900">أوامر الشراء والتوريد للمخزن</h3>
              <p className="text-xs text-zinc-500">
                تسجيل ومتابعة فواتير الشراء واعتماد استلامها لإيداع الكميات في مخزن الفرع
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSupplierToEdit(null);
                  setIsSupplierModalOpen(true);
                }}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg border border-zinc-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة مورد</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPurchaseOrderModalOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>أمر توريد وشراء جديد</span>
              </button>
            </div>
          </div>

          {/* Purchase Orders Table */}
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold">
                  <tr>
                    <th className="p-3">رقم الأمر</th>
                    <th className="p-3">المورد</th>
                    <th className="p-3">رقم فاتورة المورد</th>
                    <th className="p-3">عدد الأصناف</th>
                    <th className="p-3">القيمة الإجمالية</th>
                    <th className="p-3">الحالة</th>
                    <th className="p-3">تاريخ الإنشاء</th>
                    <th className="p-3 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {initialData.purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-zinc-400">
                        لا توجد أوامر شراء مسجلة بعد.
                      </td>
                    </tr>
                  ) : (
                    initialData.purchaseOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="p-3 font-mono font-bold text-zinc-900">{order.orderNumber}</td>
                        <td className="p-3 font-semibold text-zinc-800">{order.supplierName}</td>
                        <td className="p-3 font-mono text-zinc-500">{order.invoiceNumber || '—'}</td>
                        <td className="p-3 font-mono text-zinc-600">{order.items.length} صنف</td>
                        <td className="p-3 font-mono font-bold text-zinc-900">
                          {(order.totalMinor / 100).toFixed(2)} {initialData.currency}
                        </td>
                        <td className="p-3">
                          {order.status === PurchaseOrderStatus.RECEIVED ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>تم التوريد للمخزن</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                              <span>مسودة معلقة</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-zinc-500 font-mono">
                          {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="p-3 text-center">
                          {order.status === PurchaseOrderStatus.DRAFT ? (
                            <button
                              type="button"
                              disabled={receivingOrderId === order.id}
                              onClick={() => handleReceiveOrder(order.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md transition-colors disabled:opacity-50"
                            >
                              {receivingOrderId === order.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>اعتماد واستلام التوريد</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-zinc-400">مكتمل</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Suppliers Sub-section */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-zinc-700" />
              <span>دليل الموردين المعتمدين ({initialData.suppliers.length})</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {initialData.suppliers.map((sup) => (
                <div key={sup.id} className="p-3 rounded-lg border border-zinc-200 bg-zinc-50/50 space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-xs text-zinc-900">{sup.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSupplierToEdit(sup);
                        setIsSupplierModalOpen(true);
                      }}
                      className="text-zinc-400 hover:text-zinc-700"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {sup.contactName && <p className="text-[11px] text-zinc-600">المسؤول: {sup.contactName}</p>}
                  {sup.phone && <p className="text-[11px] text-zinc-600 font-mono">الهاتف: {sup.phone}</p>}
                  {sup.address && <p className="text-[11px] text-zinc-500">العنوان: {sup.address}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Movement Ledger */}
      {activeTab === 'movements' && (
        <div className="space-y-4">
          <div className="bg-white p-3 border border-zinc-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-zinc-700" />
              <span className="text-xs font-semibold text-zinc-800">
                سجل تدقيق حركات المخزون غير القابل للتعديل (Immutable Movement Ledger)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-500">نوع الحركة:</label>
              <select
                value={movementTypeFilter}
                onChange={(e) => {
                  setMovementTypeFilter(e.target.value);
                  setMovementsPage(1);
                }}
                className="text-xs border border-zinc-300 rounded-lg px-2.5 py-1.5 bg-white text-zinc-900 focus:outline-hidden focus:border-zinc-800"
              >
                <option value="ALL">كافة أنواع الحركات</option>
                {Object.values(InventoryMovementType).map((t) => (
                  <option key={t} value={t}>
                    {MOVEMENT_TYPE_LABELS[t].ar}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold">
                  <tr>
                    <th className="p-3">التاريخ والوقت</th>
                    <th className="p-3">نوع الحركة</th>
                    <th className="p-3">المكون</th>
                    <th className="p-3">الرصيد السابق</th>
                    <th className="p-3">التغير</th>
                    <th className="p-3">الرصيد الحالي</th>
                    <th className="p-3">الملاحظات / المرجع</th>
                    <th className="p-3">الموظف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-zinc-400">
                        لا توجد حركات مسجلة بعد في هذا الفرع.
                      </td>
                    </tr>
                  ) : (
                    paginatedMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="p-3 font-mono text-zinc-500 whitespace-nowrap">
                          {new Date(m.createdAt).toLocaleString('ar-EG')}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                              m.type === InventoryMovementType.PURCHASE
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : m.type === InventoryMovementType.SALE_POS
                                ? 'bg-zinc-100 text-zinc-700 border-zinc-200'
                                : m.type === InventoryMovementType.OPERATIONAL_CONSUMPTION
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {MOVEMENT_TYPE_LABELS[m.type]?.ar ?? m.type}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-zinc-900">
                          {m.inventoryItemNameAr} ({m.unit})
                        </td>
                        <td className="p-3 font-mono text-zinc-500">{m.quantityBefore.toFixed(3)}</td>
                        <td className="p-3 font-mono font-bold">
                          <span className={m.quantityDelta >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                            {m.quantityDelta >= 0 ? `+${m.quantityDelta.toFixed(3)}` : m.quantityDelta.toFixed(3)}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-zinc-900">{m.quantityAfter.toFixed(3)}</td>
                        <td className="p-3 text-zinc-600 max-w-xs truncate">{m.notes || m.referenceId || '—'}</td>
                        <td className="p-3 text-zinc-500">{m.createdByName || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Movements Pagination Footer */}
            {totalMovementsFiltered > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/50 px-4 py-3 text-xs text-zinc-600">
                <div className="flex items-center gap-2">
                  <span>
                    عرض {Math.min((validMovementsPage - 1) * movementsPageSize + 1, totalMovementsFiltered)} إلى{' '}
                    {Math.min(validMovementsPage * movementsPageSize, totalMovementsFiltered)} من أصل {totalMovementsFiltered} حركة
                  </span>
                  <span className="text-zinc-300">|</span>
                  <label className="flex items-center gap-1.5 text-zinc-500">
                    <span>لكل صفحة:</span>
                    <select
                      value={movementsPageSize}
                      onChange={(e) => {
                        setMovementsPageSize(Number(e.target.value));
                        setMovementsPage(1);
                      }}
                      className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-800"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </label>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMovementsPage((p) => Math.max(1, p - 1))}
                    disabled={validMovementsPage <= 1}
                    className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 font-medium hover:bg-zinc-100 disabled:opacity-40 transition"
                  >
                    السابق
                  </button>
                  <span className="px-2 font-medium">
                    صفحة {validMovementsPage} من {totalMovementsPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMovementsPage((p) => Math.min(totalMovementsPages, p + 1))}
                    disabled={validMovementsPage >= totalMovementsPages}
                    className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 font-medium hover:bg-zinc-100 disabled:opacity-40 transition"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Item Modal */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSuccess={refreshData}
        itemToEdit={itemToEdit}
      />

      {/* Adjustment / Kitchen Issue Modal */}
      <AdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        onSuccess={refreshData}
        branchId={initialData.branchId}
        selectedItem={selectedStockForAdjustment}
        allItems={initialData.stock}
        defaultType={adjustmentDefaultType}
      />

      {/* Recipe Editor Modal */}
      {selectedProductForRecipe && (
        <RecipeEditorModal
          isOpen={isRecipeModalOpen}
          onClose={() => setIsRecipeModalOpen(false)}
          onSuccess={refreshData}
          product={selectedProductForRecipe}
          existingRecipes={initialData.recipes[selectedProductForRecipe.id] ?? []}
          inventoryItems={initialData.items}
        />
      )}

      {/* Supplier Modal */}
      <SupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        onSuccess={refreshData}
        supplierToEdit={supplierToEdit}
      />

      {/* Purchase Order Modal */}
      <PurchaseOrderModal
        isOpen={isPurchaseOrderModalOpen}
        onClose={() => setIsPurchaseOrderModalOpen(false)}
        onSuccess={refreshData}
        branchId={initialData.branchId}
        suppliers={initialData.suppliers}
        inventoryItems={initialData.items}
        currencySymbol={initialData.currency}
      />
    </div>
  );
}
