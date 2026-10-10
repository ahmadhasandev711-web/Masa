'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Archive, Check, ChevronDown, CirclePlus, FolderOpen, Layers3, Pencil, Plus, QrCode, Search, Sparkles, Trash2, Utensils, X } from 'lucide-react';
import { deleteCategoryAction, deleteModifierGroupAction, deleteProductAction, saveCategoryAction, saveModifierGroupAction, saveProductAction, setBranchAvailabilityAction, setCatalogStatusAction, toggleProductFeaturedAction } from '../../../actions/catalog.actions';
import { CatalogResource } from '../../../../domain/catalog/enums/catalog-resource.enum';
import { MenuQrModal } from './menu-qr-modal';
import {
  Category,
  Group,
  Product,
  Branch,
  CatalogProps,
  Tab,
  DeleteTarget,
} from './components/menu-types';
import { MenuProductModal } from './components/menu-product-modal';
import {
  CategoriesGrid,
  ModifierGroupsGrid,
  CategoryEditor,
  GroupEditor,
} from './components/menu-categories-panel';

const inputClass = 'min-h-12 w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10';
const labelClass = 'block space-y-1.5 text-sm font-medium text-zinc-700';

function money(value: number, currency: string | null) {
  const major = new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100);
  return currency ? `${major} ${currency}` : major;
}

function toMajor(value: number) { return (value / 100).toFixed(2); }

export function MenuManager({
  categories: initialCategories,
  products: initialProducts,
  modifierGroups: initialGroups,
  branches,
  currency,
  restaurantNameAr = 'المطعم',
  restaurantNameEn = 'Restaurant',
}: CatalogProps) {

  const [categories, setCategories] = useState(initialCategories);
  const [products, setProducts] = useState(initialProducts);
  const [groups, setGroups] = useState(initialGroups);
  const [tab, setTab] = useState<Tab>('products');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  const [modal, setModal] = useState<Tab | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [branchId, setBranchId] = useState(branches[0]?.id ?? '');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Products Category Filter & Pagination
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [productPage, setProductPage] = useState(1);
  const productPageSize = 18;

  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = selectedCategoryId === 'ALL' || product.categoryId === selectedCategoryId;
    if (!matchesCategory) return false;
    if (!debouncedQuery) return true;
    return `${product.nameAr} ${product.nameEn} ${product.category.nameAr}`.toLowerCase().includes(debouncedQuery.toLowerCase());
  }), [products, selectedCategoryId, debouncedQuery]);

  const totalProductPages = Math.max(1, Math.ceil(visibleProducts.length / productPageSize));
  const validProductPage = Math.min(productPage, totalProductPages);
  const paginatedProducts = visibleProducts.slice(
    (validProductPage - 1) * productPageSize,
    validProductPage * productPageSize
  );

  const visibleCategories = useMemo(() => categories.filter((item) =>
    `${item.nameAr} ${item.nameEn}`.toLowerCase().includes(debouncedQuery.toLowerCase())
  ), [categories, debouncedQuery]);

  const visibleGroups = useMemo(() => groups.filter((item) =>
    `${item.nameAr} ${item.nameEn}`.toLowerCase().includes(debouncedQuery.toLowerCase())
  ), [groups, debouncedQuery]);

  const openNew = (type: Tab) => { setEditingId(null); setError(''); setModal(type); };
  const openEdit = (type: Tab, id: string) => { setEditingId(id); setError(''); setModal(type); };
  const close = () => { if (!pending) setModal(null); };

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setError('');
    try {
      let result: { success: boolean; error?: string };
      if (deleteTarget.type === 'product') {
        result = await deleteProductAction(deleteTarget.id);
      } else if (deleteTarget.type === 'category') {
        result = await deleteCategoryAction(deleteTarget.id);
      } else {
        result = await deleteModifierGroupAction(deleteTarget.id);
      }
      if (!result.success) {
        setError(result.error ?? 'تعذر إتمام عملية الحذف');
        setDeleteTarget(null);
        return;
      }
      setDeleteTarget(null);
      window.location.reload();
    } finally {
      setIsDeleting(false);
    }
  }


  async function saveCategory(formData: FormData) {
    setPending(true); setError('');
    try {
      const result = await saveCategoryAction({
        ...(editingId ? { id: editingId } : {}),
        nameAr: String(formData.get('nameAr') ?? ''), nameEn: String(formData.get('nameEn') ?? ''),
        description: String(formData.get('description') ?? ''),
      });
      if (!result.success) { setError(result.error); return; }
      window.location.reload();
    } finally { setPending(false); }
  }

  async function saveProduct(formData: FormData) {
    setPending(true); setError('');
    const sizeNamesAr = formData.getAll('sizeNameAr').map(String);
    const sizeNamesEn = formData.getAll('sizeNameEn').map(String);
    const sizePrices = formData.getAll('sizePrice').map(String);
    try {
      const result = await saveProductAction({
        ...(editingId ? { id: editingId } : {}),
        categoryId: String(formData.get('categoryId') ?? ''), nameAr: String(formData.get('nameAr') ?? ''),
        nameEn: String(formData.get('nameEn') ?? ''), description: String(formData.get('description') ?? ''),
        imageUrl: String(formData.get('imageUrl') ?? ''),
        isFeatured: formData.get('isFeatured') === 'on',
        sizes: sizeNamesAr.map((nameAr, index) => ({ nameAr, nameEn: sizeNamesEn[index] ?? '', price: sizePrices[index] ?? '' })),
        modifierGroupIds: formData.getAll('modifierGroupIds').map(String),
      });
      if (!result.success) { setError(result.error); return; }
      window.location.reload();
    } finally { setPending(false); }
  }

  async function toggleFeatured(productId: string) {
    const result = await toggleProductFeaturedAction(productId);
    if (!result.success) { setError(result.error); return; }
    setProducts((current) => current.map((item) => item.id !== productId ? item : { ...item, isFeatured: result.data.isFeatured }));
  }

  async function saveGroup(formData: FormData) {
    setPending(true); setError('');
    const namesAr = formData.getAll('modifierNameAr').map(String);
    const namesEn = formData.getAll('modifierNameEn').map(String);
    const prices = formData.getAll('modifierPrice').map(String);
    try {
      const result = await saveModifierGroupAction({
        ...(editingId ? { id: editingId } : {}), nameAr: String(formData.get('nameAr') ?? ''),
        nameEn: String(formData.get('nameEn') ?? ''), minSelect: Number(formData.get('minSelect')),
        maxSelect: Number(formData.get('maxSelect')),
        modifiers: namesAr.map((nameAr, index) => ({ nameAr, nameEn: namesEn[index] ?? '', price: prices[index] ?? '' })),
      });
      if (!result.success) { setError(result.error); return; }
      window.location.reload();
    } finally { setPending(false); }
  }

  async function setAvailability(product: Product, isAvailable: boolean) {
    if (!branchId) return;
    const result = await setBranchAvailabilityAction({ branchId, productId: product.id, isAvailable });
    if (!result.success) { setError(result.error); return; }
    setProducts((current) => current.map((item) => item.id !== product.id ? item : {
      ...item,
      branchAvailability: [...item.branchAvailability.filter((availability) => availability.branchId !== branchId), { branchId, isAvailable }],
    }));
  }

  async function setActive(resource: CatalogResource, id: string, isActive: boolean) {
    const result = await setCatalogStatusAction({ resource, id, isActive });
    if (!result.success) { setError(result.error); return; }
    if (resource === CatalogResource.CATEGORY) setCategories((items) => items.map((item) => item.id === id ? { ...item, isActive } : item));
    if (resource === CatalogResource.PRODUCT) setProducts((items) => items.map((item) => item.id === id ? { ...item, isActive } : item));
    if (resource === CatalogResource.MODIFIER_GROUP) setGroups((items) => items.map((item) => item.id === id ? { ...item, isActive } : item));
    window.location.reload();
  }

  const tabs: { id: Tab; label: string; icon: typeof Utensils; count: number }[] = [
    { id: 'products', label: 'الأصناف', icon: Utensils, count: products.length },
    { id: 'categories', label: 'التصنيفات', icon: FolderOpen, count: categories.length },
    { id: 'modifiers', label: 'الإضافات', icon: Layers3, count: groups.length },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-20 sm:space-y-7">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-semibold tracking-wide text-zinc-500">الكتالوج المركزي</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">المنيو والأصناف</h1><p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">إدارة المنتجات والأسعار والإضافات، ثم ضبط توفر كل صنف حسب الفرع.</p></div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-72">
            <Metric label="صنف" value={products.length} />
            <Metric label="تصنيف" value={categories.length} />
            <Metric label="إضافة" value={groups.reduce((total, group) => total + group.modifiers.length, 0)} />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {tabs.map(({ id, label, icon: Icon, count }) => <button key={id} onClick={() => setTab(id)} className={`flex min-h-12 items-center justify-between rounded-xl border px-4 text-sm font-semibold transition-colors ${tab === id ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'}`}><span className="flex items-center gap-2"><Icon size={17} />{label}</span><span className={`rounded-full px-2 py-0.5 text-xs ${tab === id ? 'bg-white/15 text-white' : 'bg-zinc-100 text-zinc-600'}`}>{count}</span></button>)}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm"><Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={17} /><input className={`${inputClass} pr-10`} placeholder="ابحث في المنيو" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        {tab === 'products' && branches.length > 0 && <label className="relative block w-full sm:w-64"><span className="sr-only">الفرع</span><select className={`${inputClass} appearance-none pl-10`} value={branchId} onChange={(event) => setBranchId(event.target.value)}>{branches.map((branch) => <option value={branch.id} key={branch.id}>{branch.nameAr}</option>)}</select><ChevronDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={17} /></label>}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button type="button" onClick={() => setIsQrModalOpen(true)} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 transition"><QrCode size={16} /><span>كيو آر المنيو</span></button>
          <button onClick={() => openNew(tab)} className="flex min-h-12 flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"><Plus size={17} />{tab === 'products' ? 'إضافة صنف' : tab === 'categories' ? 'إضافة تصنيف' : 'إنشاء مجموعة إضافات'}</button>
        </div>
      </div>

      {error && !modal && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <p className="leading-relaxed flex-1">{error}</p>
          <button type="button" onClick={() => setError('')} aria-label="إغلاق التنبيه" className="text-rose-500 hover:text-rose-800">
            <X size={16} />
          </button>
        </div>
      )}

      {tab === 'products' && (
        <div className="space-y-3">
          {/* Category Filter Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setSelectedCategoryId('ALL');
                setProductPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 font-semibold transition whitespace-nowrap ${
                selectedCategoryId === 'ALL'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              جميع الأقسام ({products.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedCategoryId(c.id);
                  setProductPage(1);
                }}
                className={`rounded-lg px-3 py-1.5 font-semibold transition whitespace-nowrap ${
                  selectedCategoryId === c.id
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                {c.nameAr}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {paginatedProducts.map((product) => {
              const availability =
                product.branchAvailability.find((item) => item.branchId === branchId)?.isAvailable ?? true;
              return (
                <article key={product.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                  <div className="flex gap-3 p-4 sm:p-5">
                    <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-500">
                      {product.imageUrl ? (
                        <Image src={product.imageUrl} alt="" width={56} height={56} unoptimized className="size-14 rounded-xl object-cover" />
                      ) : (
                        <Utensils size={20} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className={`font-semibold ${product.isActive ? 'text-zinc-950' : 'text-zinc-400'}`}>
                              {product.nameAr}
                            </p>
                            {product.isFeatured && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                <Sparkles size={11} className="text-amber-600" />
                                مميز بالسلايدر
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-zinc-500">
                            {product.category.nameAr}
                            {!product.isActive && ' · مؤرشف'}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <button
                            aria-label={product.isFeatured ? 'إلغاء التمييز في السلايدر' : 'تمييز في السلايدر الرئيسي'}
                            title={product.isFeatured ? 'معروض في السلايدر الرئيسي للموقع' : 'إضافة إلى السلايدر الرئيسي'}
                            onClick={() => toggleFeatured(product.id)}
                            className={`grid size-10 place-items-center rounded-xl border transition-colors ${
                              product.isFeatured
                                ? 'border-amber-400 bg-amber-50 text-amber-600 shadow-sm'
                                : 'border-zinc-200 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700'
                            }`}
                          >
                            <Sparkles size={16} />
                          </button>
                          <button
                            aria-label={`تعديل ${product.nameAr}`}
                            onClick={() => openEdit('products', product.id)}
                            className="grid size-10 place-items-center rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            aria-label={product.isActive ? 'أرشفة الصنف' : 'إعادة تفعيل الصنف'}
                            onClick={() => setActive(CatalogResource.PRODUCT, product.id, !product.isActive)}
                            className="grid size-10 place-items-center rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                          >
                            <Archive size={16} />
                          </button>
                          <button
                            aria-label={`حذف ${product.nameAr}`}
                            title="حذف الصنف نهائياً"
                            onClick={() => setDeleteTarget({ type: 'product', id: product.id, name: product.nameAr })}
                            className="grid size-10 place-items-center rounded-xl border border-zinc-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="mt-3 text-xs leading-5 text-zinc-500">{product.description || 'بدون وصف'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-zinc-100 px-4 py-3 sm:px-5">
                    {product.sizes.map((size) => (
                      <span key={size.id} className="rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs text-zinc-700">
                        {size.nameAr} · {money(size.price, currency)}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3 sm:px-5">
                    <span className="text-xs text-zinc-500">
                      التوفر في {branches.find((branch) => branch.id === branchId)?.nameAr || 'الفرع'}
                    </span>
                    <button
                      disabled={!product.isActive || !branchId}
                      onClick={() => setAvailability(product, !availability)}
                      className={`min-h-10 rounded-lg px-3 text-xs font-semibold disabled:opacity-50 ${
                        availability ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {availability ? 'متاح' : 'غير متاح'}
                    </button>
                  </div>
                </article>
              );
            })}
            {visibleProducts.length === 0 && (
              <EmptyState title="لا توجد أصناف" description="ابدأ بإضافة أول صنف إلى المنيو أو قم بتغيير التصنيف المحدد." />
            )}
          </div>

          {/* Product Pagination Footer */}
          {visibleProducts.length > productPageSize && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-600">
              <span>
                عرض {Math.min((validProductPage - 1) * productPageSize + 1, visibleProducts.length)} إلى{' '}
                {Math.min(validProductPage * productPageSize, visibleProducts.length)} من أصل {visibleProducts.length} صنف
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                  disabled={validProductPage <= 1}
                  className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 font-medium hover:bg-zinc-100 disabled:opacity-40 transition"
                >
                  السابق
                </button>
                <span className="px-2 font-medium">
                  صفحة {validProductPage} من {totalProductPages}
                </span>
                <button
                  type="button"
                  onClick={() => setProductPage((p) => Math.min(totalProductPages, p + 1))}
                  disabled={validProductPage >= totalProductPages}
                  className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 font-medium hover:bg-zinc-100 disabled:opacity-40 transition"
                >
                  التالي
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'categories' && (
        <CategoriesGrid
          categories={visibleCategories}
          onEdit={(id) => openEdit('categories', id)}
          onToggleStatus={setActive}
          onDelete={setDeleteTarget}
        />
      )}

      {tab === 'modifiers' && (
        <ModifierGroupsGrid
          groups={visibleGroups}
          currency={currency}
          money={money}
          onEdit={(id) => openEdit('modifiers', id)}
          onToggleStatus={setActive}
          onDelete={setDeleteTarget}
        />
      )}

      {modal && (
        <EditorModal title={editorTitle(modal, editingId)} onClose={close}>
          {error && (
            <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
              {error}
            </p>
          )}
          {modal === 'categories' && (
            <CategoryEditor
              key={editingId ?? 'new'}
              category={categories.find((item) => item.id === editingId)}
              onSave={saveCategory}
              onCancel={close}
              pending={pending}
            />
          )}
          {modal === 'products' && (
            <MenuProductModal
              key={editingId ?? 'new'}
              product={products.find((item) => item.id === editingId)}
              categories={categories}
              groups={groups}
              onSave={saveProduct}
              onCancel={close}
              pending={pending}
            />
          )}
          {modal === 'modifiers' && (
            <GroupEditor
              key={editingId ?? 'new'}
              group={groups.find((item) => item.id === editingId)}
              onSave={saveGroup}
              onCancel={close}
              pending={pending}
            />
          )}
        </EditorModal>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 backdrop-blur-xs p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="grid size-10 place-items-center rounded-full bg-rose-50">
                <Trash2 size={20} />
              </div>
              <h3 id="delete-dialog-title" className="text-lg font-bold text-zinc-950">
                تأكيد الحذف
              </h3>
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف <strong className="text-zinc-900 font-semibold">{deleteTarget.name}</strong>؟
              {deleteTarget.type === 'product' && ' (إذا كان الصنف يحتوي على طلبات ومبيعات مسجلة في النظام، فلن يُسمح بحذفه لحماية السجلات المالية وسيتعين عليك أرشفته/إيقافه).'}
              {deleteTarget.type === 'category' && ' (لن يُسمح بحذف التصنيف إذا كان يحتوي على أصناف بداخله).'}
              {deleteTarget.type === 'modifier' && ' (لن يُسمح بحذف المجموعة إذا كانت مرتبطة بأصناف أو مستخدمة في طلبات سابقة).'}
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="min-h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="min-h-11 rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white hover:bg-rose-700 transition disabled:opacity-50"
              >
                {isDeleting ? 'جارٍ الحذف...' : 'تأكيد الحذف'}
              </button>
            </div>
          </div>
        </div>
      )}

      <MenuQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        restaurantNameAr={restaurantNameAr}
        restaurantNameEn={restaurantNameEn}
        branches={branches.map((b) => ({ id: b.id, nameAr: b.nameAr, phone: b.phone || '' }))}
      />

    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-zinc-50 px-3 py-2.5"><p className="text-lg font-bold tabular-nums text-zinc-950">{value}</p><p className="text-[11px] text-zinc-500">{label}</p></div>; }

function EmptyState({ title, description }: { title: string; description: string }) { return <div className="col-span-full rounded-2xl border border-dashed border-zinc-300 bg-white px-5 py-12 text-center"><Archive className="mx-auto text-zinc-400" size={24} /><h2 className="mt-3 font-semibold text-zinc-800">{title}</h2><p className="mt-1 text-sm text-zinc-500">{description}</p></div>; }

function EditorModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/45 backdrop-blur-xs p-0 sm:items-center sm:p-4">
      <section role="dialog" aria-modal="true" aria-label={title} className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-4 shadow-2xl sm:max-w-2xl sm:rounded-3xl sm:p-6">
        <header className="sticky top-0 z-10 -mx-4 -mt-4 mb-5 flex items-center justify-between border-b border-zinc-100 bg-white px-4 py-4 sm:-mx-6 sm:-mt-6 sm:px-6">
          <h2 className="text-lg font-bold text-zinc-950">{title}</h2>
          <button onClick={onClose} aria-label="إغلاق" className="grid size-10 place-items-center rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition">
            <X size={18} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function editorTitle(tab: Tab, id: string | null) { const action = id ? 'تعديل' : 'إضافة'; if (tab === 'products') return `${action} صنف`; if (tab === 'categories') return `${action} تصنيف`; return `${action} مجموعة إضافات`; }
