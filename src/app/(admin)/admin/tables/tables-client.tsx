'use client';

import { useState, useMemo, useTransition } from 'react';
import {
  Armchair,
  Layers,
  Plus,
  Search,
  Users,
  Edit2,
  Trash2,
  QrCode,
  Clock,
  ShoppingBag,
  X,
  Check,
  AlertCircle,
  Copy,
  Printer,
  Square,
  Circle,
  RectangleHorizontal,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { TableStatus, TableShape } from '../../../../domain/tables/enums';
import { TableItemView } from '../../../../application/tables/use-cases/list-tables.use-case';
import {
  listTablesAction,
  createTableAction,
  updateTableAction,
  deleteTableAction,
  createTableSectionAction,
  updateTableSectionAction,
  deleteTableSectionAction,
} from '../../../actions/table.actions';
import { EditTableModal, SectionItem } from './components/edit-table-modal';
import { ManageSectionsModal } from './components/manage-sections-modal';
import { TableQrModal } from './components/table-qr-modal';

interface TablesClientProps {
  initialSections: SectionItem[];
  initialTables: TableItemView[];
  branches: Array<{ id: string; nameAr: string; code: string }>;
  activeBranchId: string;
  currencySymbol: string;
  restaurantNameAr: string;
}

export function TablesClient({
  initialSections,
  initialTables,
  branches,
  activeBranchId,
  currencySymbol,
  restaurantNameAr,
}: TablesClientProps) {
  const [currentBranchId, setCurrentBranchId] = useState(activeBranchId);
  const [sections, setSections] = useState<SectionItem[]>(initialSections);
  const [tables, setTables] = useState<TableItemView[]>(initialTables);

  // Filters & Search
  const [selectedSectionId, setSelectedSectionId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers state
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableItemView | null>(null);

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<SectionItem | null>(null);

  const [qrModalTable, setQrModalTable] = useState<TableItemView | null>(null);
  const [deleteConfirmTable, setDeleteConfirmTable] = useState<TableItemView | null>(null);

  // Form states - Table
  const [tableNumber, setTableNumber] = useState('');
  const [tableSectionId, setTableSectionId] = useState<string>('');
  const [tableCapacity, setTableCapacity] = useState<number>(4);
  const [tableShape, setTableShape] = useState<TableShape>(TableShape.SQUARE);
  const [tableSortOrder, setTableSortOrder] = useState<number>(0);
  const [tableStatus, setTableStatus] = useState<TableStatus>(TableStatus.AVAILABLE);

  // Form states - Section
  const [sectionNameAr, setSectionNameAr] = useState('');
  const [sectionNameEn, setSectionNameEn] = useState('');
  const [sectionSortOrder, setSectionSortOrder] = useState<number>(0);

  // Action states
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Refresh tables list for selected branch
  const refreshBranchData = async (branchId: string) => {
    startTransition(async () => {
      setErrorMessage(null);
      const res = await listTablesAction(branchId);
      if (res.success) {
        setSections(res.data.sections);
        setTables(res.data.tables);
      } else {
        setErrorMessage(res.error);
      }
    });
  };

  const handleBranchChange = (newBranchId: string) => {
    setCurrentBranchId(newBranchId);
    setSelectedSectionId('ALL');
    refreshBranchData(newBranchId);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const totalTables = tables.length;
    const totalSeats = tables.reduce((acc, t) => acc + t.capacity, 0);
    const availableCount = tables.filter((t) => t.status === TableStatus.AVAILABLE).length;
    const occupiedCount = tables.filter((t) => t.status === TableStatus.OCCUPIED).length;
    const billPrintedCount = tables.filter((t) => t.status === TableStatus.BILL_PRINTED).length;
    return { totalTables, totalSeats, availableCount, occupiedCount, billPrintedCount };
  }, [tables]);

  // Filtered Tables
  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      if (selectedSectionId !== 'ALL') {
        if (selectedSectionId === 'NONE' && table.sectionId !== null) return false;
        if (selectedSectionId !== 'NONE' && table.sectionId !== selectedSectionId) return false;
      }
      if (statusFilter !== 'ALL' && table.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesNumber = table.tableNumber.toLowerCase().includes(query);
        const matchesSection = table.sectionNameAr?.toLowerCase().includes(query);
        if (!matchesNumber && !matchesSection) return false;
      }
      return true;
    });
  }, [tables, selectedSectionId, statusFilter, searchQuery]);

  // Open Create Table Modal
  const openCreateTableModal = () => {
    setEditingTable(null);
    setTableNumber('');
    setTableSectionId(sections[0]?.id || '');
    setTableCapacity(4);
    setTableShape(TableShape.SQUARE);
    setTableSortOrder(tables.length + 1);
    setTableStatus(TableStatus.AVAILABLE);
    setErrorMessage(null);
    setIsTableModalOpen(true);
  };

  // Open Edit Table Modal
  const openEditTableModal = (table: TableItemView) => {
    setEditingTable(table);
    setTableNumber(table.tableNumber);
    setTableSectionId(table.sectionId || '');
    setTableCapacity(table.capacity);
    setTableShape((table.shape as TableShape) || TableShape.SQUARE);
    setTableSortOrder(0);
    setTableStatus(table.status);
    setErrorMessage(null);
    setIsTableModalOpen(true);
  };

  // Submit Table (Create or Update)
  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) {
      setErrorMessage('يرجى إدخال رقم أو اسم الطاولة');
      return;
    }

    startTransition(async () => {
      setErrorMessage(null);
      if (editingTable) {
        const res = await updateTableAction({
          id: editingTable.id,
          tableNumber: tableNumber.trim(),
          sectionId: tableSectionId || null,
          capacity: tableCapacity,
          shape: tableShape,
          status: tableStatus,
          sortOrder: tableSortOrder,
        });
        if (res.success) {
          setIsTableModalOpen(false);
          setSuccessMessage('تم تحديث بيانات الطاولة بنجاح');
          refreshBranchData(currentBranchId);
        } else {
          setErrorMessage(res.error);
        }
      } else {
        const res = await createTableAction({
          branchId: currentBranchId,
          tableNumber: tableNumber.trim(),
          sectionId: tableSectionId || null,
          capacity: tableCapacity,
          shape: tableShape,
          sortOrder: tableSortOrder,
        });
        if (res.success) {
          setIsTableModalOpen(false);
          setSuccessMessage('تمت إضافة الطاولة بنجاح');
          refreshBranchData(currentBranchId);
        } else {
          setErrorMessage(res.error);
        }
      }
    });
  };

  // Delete Table
  const handleDeleteTable = async () => {
    if (!deleteConfirmTable) return;
    startTransition(async () => {
      setErrorMessage(null);
      const res = await deleteTableAction(deleteConfirmTable.id);
      if (res.success) {
        setDeleteConfirmTable(null);
        setSuccessMessage('تم حذف الطاولة بنجاح');
        refreshBranchData(currentBranchId);
      } else {
        setErrorMessage(res.error);
      }
    });
  };

  // Open Section Modal
  const openManageSectionsModal = () => {
    setEditingSection(null);
    setSectionNameAr('');
    setSectionNameEn('');
    setSectionSortOrder(sections.length + 1);
    setErrorMessage(null);
    setIsSectionModalOpen(true);
  };

  // Save Section (Create or Update)
  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionNameAr.trim() || !sectionNameEn.trim()) {
      setErrorMessage('يرجى إدخال اسم القسم بالعربية والإنجليزية');
      return;
    }

    startTransition(async () => {
      setErrorMessage(null);
      if (editingSection) {
        const res = await updateTableSectionAction({
          id: editingSection.id,
          nameAr: sectionNameAr.trim(),
          nameEn: sectionNameEn.trim(),
          sortOrder: sectionSortOrder,
        });
        if (res.success) {
          setEditingSection(null);
          setSectionNameAr('');
          setSectionNameEn('');
          setSuccessMessage('تم تحديث القسم بنجاح');
          refreshBranchData(currentBranchId);
        } else {
          setErrorMessage(res.error);
        }
      } else {
        const res = await createTableSectionAction({
          branchId: currentBranchId,
          nameAr: sectionNameAr.trim(),
          nameEn: sectionNameEn.trim(),
          sortOrder: sectionSortOrder,
        });
        if (res.success) {
          setSectionNameAr('');
          setSectionNameEn('');
          setSectionSortOrder(sections.length + 2);
          setSuccessMessage('تمت إضافة القسم بنجاح');
          refreshBranchData(currentBranchId);
        } else {
          setErrorMessage(res.error);
        }
      }
    });
  };

  // Delete Section
  const handleDeleteSection = async (sectionId: string) => {
    startTransition(async () => {
      setErrorMessage(null);
      const res = await deleteTableSectionAction(sectionId);
      if (res.success) {
        setSuccessMessage('تم حذف القسم بنجاح');
        refreshBranchData(currentBranchId);
      } else {
        setErrorMessage(res.error);
      }
    });
  };

  // Copy QR URL
  const getTableMenuUrl = (table: TableItemView) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/menu?table=${encodeURIComponent(table.tableNumber)}`;
  };

  const handleCopyLink = (table: TableItemView) => {
    const url = getTableMenuUrl(table);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getStatusBadge = (status: TableStatus) => {
    switch (status) {
      case TableStatus.AVAILABLE:
        return {
          label: 'متاحة',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
        };
      case TableStatus.OCCUPIED:
        return {
          label: 'مشغولة',
          bg: 'bg-zinc-900 text-white border-zinc-900',
          dot: 'bg-rose-400',
        };
      case TableStatus.BILL_PRINTED:
        return {
          label: 'مطبوع الشيك',
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
        };
      case TableStatus.RESERVED:
        return {
          label: 'محجوزة',
          bg: 'bg-sky-50 text-sky-800 border-sky-200',
          dot: 'bg-sky-500',
        };
      case TableStatus.CLEANING:
        return {
          label: 'قيد التنظيف',
          bg: 'bg-zinc-100 text-zinc-700 border-zinc-200',
          dot: 'bg-zinc-400',
        };
      default:
        return {
          label: status,
          bg: 'bg-zinc-100 text-zinc-700 border-zinc-200',
          dot: 'bg-zinc-400',
        };
    }
  };

  const getShapeIcon = (shape: string) => {
    switch (shape) {
      case TableShape.ROUND:
        return <Circle className="size-3.5 text-zinc-500" strokeWidth={1.8} />;
      case TableShape.RECTANGLE:
        return <RectangleHorizontal className="size-3.5 text-zinc-500" strokeWidth={1.8} />;
      case TableShape.SQUARE:
      default:
        return <Square className="size-3.5 text-zinc-500" strokeWidth={1.8} />;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Header & Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-zinc-900 text-white shadow-xs">
              <Armchair className="size-5" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900">الصالة والطاولات</h1>
              <p className="text-xs text-zinc-500">
                إدارة خريطة الطاولات، سعة الصالة، أقسام القاعات، وبطاقات الـ QR الرقمية
              </p>
            </div>
          </div>
        </div>

        {/* Top actions & Branch selection */}
        <div className="flex flex-wrap items-center gap-2.5">
          {branches.length > 1 && (
            <div className="relative">
              <select
                aria-label="تحديد الفرع الحالي"
                value={currentBranchId}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="h-10 rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-800 shadow-2xs hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    فرع: {b.nameAr} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={openManageSectionsModal}
            className="flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 hover:text-zinc-900 active:scale-95 transition"
          >
            <Layers className="size-4 text-zinc-600" strokeWidth={1.8} />
            <span>إدارة الأقسام ({sections.length})</span>
          </button>

          <button
            type="button"
            onClick={openCreateTableModal}
            className="flex h-10 items-center gap-2 rounded-xl bg-zinc-900 px-4 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 active:scale-95 transition"
          >
            <Plus className="size-4" strokeWidth={2} />
            <span>إضافة طاولة</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs font-medium text-rose-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-800"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs font-medium text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="size-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* 2. KPI Metrics Ribbon */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[11px] font-medium">إجمالي الطاولات</span>
            <Armchair className="size-4 text-zinc-400" strokeWidth={1.8} />
          </div>
          <p className="mt-2 text-xl font-bold text-zinc-900">{stats.totalTables}</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[11px] font-medium">سعة المقاعد</span>
            <Users className="size-4 text-zinc-400" strokeWidth={1.8} />
          </div>
          <p className="mt-2 text-xl font-bold text-zinc-900">
            {stats.totalSeats} <span className="text-xs font-normal text-zinc-500">فرد</span>
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-semibold">متاحة حالياً</span>
            <span className="size-2 rounded-full bg-emerald-500" />
          </div>
          <p className="mt-2 text-xl font-bold text-emerald-900">{stats.availableCount}</p>
        </div>

        <div className="rounded-xl border border-zinc-300 bg-zinc-900 p-3.5 shadow-2xs text-white">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold">مشغولة</span>
            <span className="size-2 rounded-full bg-rose-400" />
          </div>
          <p className="mt-2 text-xl font-bold text-white">{stats.occupiedCount}</p>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-xl border border-amber-200/80 bg-amber-50/50 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[11px] font-semibold">مطبوع الشيك</span>
            <span className="size-2 rounded-full bg-amber-500" />
          </div>
          <p className="mt-2 text-xl font-bold text-amber-900">{stats.billPrintedCount}</p>
        </div>
      </div>

      {/* 3. Filter Toolbar & Search */}
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs">
        {/* Section Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedSectionId('ALL')}
            className={`shrink-0 rounded-xl px-3.5 py-1.5 font-semibold transition ${
              selectedSectionId === 'ALL'
                ? 'bg-zinc-900 text-white shadow-2xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70'
            }`}
          >
            كافة الأقسام ({tables.length})
          </button>

          {sections.map((sec) => {
            const count = tables.filter((t) => t.sectionId === sec.id).length;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setSelectedSectionId(sec.id)}
                className={`shrink-0 rounded-xl px-3.5 py-1.5 font-semibold transition ${
                  selectedSectionId === sec.id
                    ? 'bg-zinc-900 text-white shadow-2xs'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70'
                }`}
              >
                {sec.nameAr} ({count})
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setSelectedSectionId('NONE')}
            className={`shrink-0 rounded-xl px-3.5 py-1.5 font-semibold transition ${
              selectedSectionId === 'NONE'
                ? 'bg-zinc-900 text-white shadow-2xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70'
            }`}
          >
            بدون قسم ({tables.filter((t) => !t.sectionId).length})
          </button>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-100">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="بحث برقم الطاولة أو اسم القسم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 py-2 pr-9 pl-3 text-xs text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-zinc-400" strokeWidth={1.8} />
            <select
              aria-label="تصفية حسب حالة الطاولة"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-xl border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              <option value="ALL">جميع الحالات</option>
              <option value={TableStatus.AVAILABLE}>المتاحة فقط</option>
              <option value={TableStatus.OCCUPIED}>المشغولة فقط</option>
              <option value={TableStatus.BILL_PRINTED}>مطبوع الشيك</option>
              <option value={TableStatus.RESERVED}>المحجوزة</option>
              <option value={TableStatus.CLEANING}>قيد التنظيف</option>
            </select>

            <button
              type="button"
              onClick={() => refreshBranchData(currentBranchId)}
              disabled={isPending}
              title="تحديث البيانات"
              aria-label="تحديث البيانات"
              className="grid size-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 active:scale-95 transition disabled:opacity-50"
            >
              <RefreshCw className={`size-3.5 ${isPending ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Table Floor Grid */}
      {filteredTables.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white py-16 px-4 text-center">
          <div className="grid size-12 place-items-center rounded-2xl bg-zinc-100 text-zinc-400">
            <Armchair className="size-6" strokeWidth={1.5} />
          </div>
          <h3 className="mt-3 text-sm font-bold text-zinc-800">لا توجد طاولات مطابقة</h3>
          <p className="mt-1 max-w-sm text-xs text-zinc-500">
            لم يتم العثور على أي طاولة مطابقة للبحث أو معايير التصفية المحددة.
          </p>
          <button
            type="button"
            onClick={openCreateTableModal}
            className="mt-4 flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
          >
            <Plus className="size-3.5" />
            <span>إضافة طاولة الآن</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredTables.map((table) => {
            const statusInfo = getStatusBadge(table.status);
            const isBusy =
              table.status === TableStatus.OCCUPIED || table.status === TableStatus.BILL_PRINTED;

            return (
              <div
                key={table.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs hover:border-zinc-300 hover:shadow-xs transition"
              >
                <div>
                  {/* Card Top: Number + Shape + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="grid size-9 place-items-center rounded-xl bg-zinc-100 text-zinc-800 font-bold text-sm">
                        {table.tableNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-zinc-900">
                            طاولة {table.tableNumber}
                          </span>
                          <span title={`شكل الطاولة: ${table.shape}`}>
                            {getShapeIcon(table.shape)}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 truncate max-w-[120px]">
                          {table.sectionNameAr || 'بدون قسم'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] font-bold ${statusInfo.bg}`}
                    >
                      <span className={`size-1.5 rounded-full ${statusInfo.dot}`} />
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Attributes: Capacity & Section */}
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-600">
                    <span className="flex items-center gap-1 rounded-md bg-zinc-50 px-2 py-0.5 border border-zinc-100">
                      <Users className="size-3 text-zinc-400" />
                      <span>{table.capacity} مقاعد</span>
                    </span>

                    {table.sectionNameAr && (
                      <span className="flex items-center gap-1 rounded-md bg-zinc-50 px-2 py-0.5 border border-zinc-100 truncate">
                        <Layers className="size-3 text-zinc-400 shrink-0" />
                        <span className="truncate">{table.sectionNameAr}</span>
                      </span>
                    )}
                  </div>

                  {/* Active Order Details (if occupied) */}
                  {isBusy && table.activeOrder && (
                    <div className="mt-3 rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-2.5 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-zinc-700">
                        <span className="font-mono text-[11px] font-bold">
                          #{table.activeOrder.orderNumber}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                          <Clock className="size-3 text-zinc-400" />
                          <span>{table.activeOrder.minutesSeated} دقيقة</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60 font-bold">
                        <span className="flex items-center gap-1 text-[11px] text-zinc-500 font-normal">
                          <ShoppingBag className="size-3" />
                          <span>{table.activeOrder.itemsCount} أصناف</span>
                        </span>
                        <span className="text-zinc-900">
                          {(table.activeOrder.totalMinor / 100).toFixed(2)} {currencySymbol}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Bottom Actions */}
                <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setQrModalTable(table)}
                    className="flex items-center gap-1 text-zinc-600 hover:text-zinc-900 font-medium"
                    title="رمز QR للطاولة"
                  >
                    <QrCode className="size-3.5" />
                    <span>رمز QR</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditTableModal(table)}
                      className="grid size-7 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition"
                      title="تعديل الطاولة"
                      aria-label="تعديل الطاولة"
                    >
                      <Edit2 className="size-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmTable(table)}
                      disabled={isBusy}
                      title={isBusy ? 'لا يمكن حذف طاولة مشغولة' : 'حذف الطاولة'}
                      aria-label={isBusy ? 'لا يمكن حذف طاولة مشغولة' : 'حذف الطاولة'}
                      className={`grid size-7 place-items-center rounded-lg transition ${
                        isBusy
                          ? 'cursor-not-allowed text-zinc-300'
                          : 'text-zinc-500 hover:bg-rose-50 hover:text-rose-600'
                      }`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Modal: Add / Edit Table */}
      <EditTableModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        editingTable={editingTable}
        sections={sections}
        isPending={isPending}
        tableNumber={tableNumber}
        setTableNumber={setTableNumber}
        tableSectionId={tableSectionId}
        setTableSectionId={setTableSectionId}
        tableCapacity={tableCapacity}
        setTableCapacity={setTableCapacity}
        tableShape={tableShape}
        setTableShape={setTableShape}
        tableSortOrder={tableSortOrder}
        setTableSortOrder={setTableSortOrder}
        tableStatus={tableStatus}
        setTableStatus={setTableStatus}
        onSave={handleSaveTable}
      />

      {/* 6. Modal: Manage Sections */}
      <ManageSectionsModal
        isOpen={isSectionModalOpen}
        onClose={() => setIsSectionModalOpen(false)}
        sections={sections}
        tables={tables}
        editingSection={editingSection}
        setEditingSection={setEditingSection}
        sectionNameAr={sectionNameAr}
        setSectionNameAr={setSectionNameAr}
        sectionNameEn={sectionNameEn}
        setSectionNameEn={setSectionNameEn}
        sectionSortOrder={sectionSortOrder}
        setSectionSortOrder={setSectionSortOrder}
        isPending={isPending}
        onSaveSection={handleSaveSection}
        onDeleteSection={handleDeleteSection}
      />

      {/* 7. Modal: Table QR Code & Standee Card */}
      <TableQrModal
        table={qrModalTable}
        onClose={() => setQrModalTable(null)}
        restaurantNameAr={restaurantNameAr}
        getTableMenuUrl={getTableMenuUrl}
        onCopyLink={handleCopyLink}
        copiedLink={copiedLink}
      />

      {/* 8. Modal: Delete Confirm Table */}
      {deleteConfirmTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl animate-in zoom-in-95 text-right">
            <h3 className="text-base font-bold text-zinc-900">تأكيد حذف الطاولة</h3>
            <p className="mt-2 text-xs text-zinc-600">
              هل أنت متأكد من رغبتك في حذف الطاولة رقم{' '}
              <strong className="text-zinc-900">{deleteConfirmTable.tableNumber}</strong>؟ لا يمكن
              التراجع عن هذه الخطوة.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDeleteConfirmTable(null)}
                className="rounded-xl border border-zinc-200 px-4 py-2 font-semibold text-zinc-600 hover:bg-zinc-50"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleDeleteTable}
                disabled={isPending}
                className="rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50"
              >
                {isPending ? 'جاري الحذف...' : 'نعم، حذف الطاولة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
