'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search,
  ShoppingBag,
  Star,
  Check,
  ArrowLeft,
  ArrowRight,
  X,
  Plus,
  Minus,
  ShoppingCart,
  Utensils,
} from 'lucide-react';
import { useCart } from '../cart-context';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModifierItem {
  id: string;
  nameAr: string;
  nameEn: string;
  priceDelta: number;
}

interface ModifierGroupItem {
  id: string;
  nameAr: string;
  nameEn: string;
  minSelect: number;
  maxSelect: number;
  modifiers: ModifierItem[];
}

interface ProductItem {
  id: string;
  categoryId: string;
  nameAr: string;
  nameEn: string;
  description: string | null;
  imageUrl: string | null;
  isFeatured?: boolean;
  category: {
    id: string;
    nameAr: string;
    nameEn: string;
  };
  sizes: Array<{
    id: string;
    nameAr: string;
    nameEn: string;
    price: number;
  }>;
  modifierGroups: Array<{
    group: ModifierGroupItem;
  }>;
}

interface CategoryItem {
  id: string;
  nameAr: string;
  nameEn: string;
}

interface MenuClientProps {
  categories: CategoryItem[];
  products: ProductItem[];
  currencySymbol: string;
}

// ─── Product Detail Modal ─────────────────────────────────────────────────────

interface ProductModalProps {
  product: ProductItem;
  currencySymbol: string;
  isAr: boolean;
  onClose: () => void;
  onAdd: (sizeId: string, modifiers: ModifierItem[], qty: number) => void;
}

function ProductModal({ product, currencySymbol, isAr, onClose, onAdd }: ProductModalProps) {
  const [selectedSizeId, setSelectedSizeId] = useState(product.sizes[0]?.id ?? '');
  const [selectedModifiers, setSelectedModifiers] = useState<ModifierItem[]>([]);
  const [quantity, setQuantity] = useState(1);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const selectedSize = product.sizes.find((s) => s.id === selectedSizeId) ?? product.sizes[0];
  const modifiersTotal = selectedModifiers.reduce((acc, m) => acc + m.priceDelta, 0);
  const totalMinor = ((selectedSize?.price ?? 0) + modifiersTotal) * quantity;

  const handleToggleModifier = (mod: ModifierItem, group: ModifierGroupItem) => {
    const isSelected = selectedModifiers.some((m) => m.id === mod.id);
    if (isSelected) {
      setSelectedModifiers((prev) => prev.filter((m) => m.id !== mod.id));
    } else if (group.maxSelect === 1) {
      const otherIds = group.modifiers.map((m) => m.id);
      setSelectedModifiers((prev) => [...prev.filter((m) => !otherIds.includes(m.id)), mod]);
    } else {
      const count = selectedModifiers.filter((m) => group.modifiers.some((gm) => gm.id === m.id)).length;
      if (count < group.maxSelect) setSelectedModifiers((prev) => [...prev, mod]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Sheet on mobile, centered modal on desktop */}
      <div className="relative w-full sm:max-w-lg max-h-[95dvh] sm:max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden animate-fadeInUp">

        {/* ── Image Header ── */}
        <div className="relative h-56 sm:h-72 w-full shrink-0">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={isAr ? product.nameAr : product.nameEn}
              fill
              sizes="(max-width: 640px) 100vw, 512px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-zinc-800 text-zinc-600">
              <Utensils className="h-14 w-14" strokeWidth={1.25} />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />

          {/* Badges on image */}
          <div className="absolute top-4 start-4 flex flex-col gap-1.5">
            <span className="rounded-lg border border-amber-500/40 bg-amber-500/20 px-2.5 py-1 text-2xs font-bold text-amber-300 backdrop-blur-sm">
              {isAr ? product.category.nameAr : product.category.nameEn}
            </span>
            {product.isFeatured && (
              <span className="rounded-full bg-gradient-to-r from-amber-600 to-amber-500 px-2.5 py-0.5 text-2xs font-bold text-white shadow-sm">
                {isAr ? 'الأكثر طلباً' : 'Best Seller'}
              </span>
            )}
          </div>

          {/* Rating badge */}
          <div className="absolute top-4 end-14 flex items-center gap-1 rounded-xl border border-white/15 bg-black/50 px-2.5 py-1 backdrop-blur-sm">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-white font-mono">4.9</span>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 end-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-zinc-950/70 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors backdrop-blur-sm"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 scrollbar-none">

          {/* Name + description */}
          <div>
            <h2 className="text-xl font-extrabold text-white leading-snug">
              {isAr ? product.nameAr : product.nameEn}
            </h2>
            {product.description && (
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {product.description}
              </p>
            )}
          </div>

          {/* Sizes */}
          {product.sizes.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-2xs font-bold tracking-widest text-zinc-500 uppercase">
                {isAr ? 'اختر المقاس / الحجم' : 'Select Size'}
                <span className="text-rose-400 ms-1">*</span>
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {product.sizes.map((s) => {
                  const isSelected = selectedSizeId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSizeId(s.id)}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-all ${
                        isSelected
                          ? 'border-rose-500 bg-rose-500/10 text-white shadow-sm shadow-rose-500/10'
                          : 'border-white/10 bg-white/5 text-zinc-300 hover:border-white/25 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-rose-500 bg-rose-500' : 'border-zinc-600'}`}>
                          {isSelected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                        </div>
                        <span className="font-semibold">{isAr ? s.nameAr : s.nameEn}</span>
                      </div>
                      <span className="font-mono font-bold text-white">
                        {(s.price / 100).toFixed(2)}
                        <span className="text-xs font-normal text-zinc-400 ms-1">{currencySymbol}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modifier Groups */}
          {product.modifierGroups?.length > 0 && product.modifierGroups.map(({ group }) => (
            <div key={group.id} className="space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-2xs font-bold tracking-widest text-zinc-500 uppercase">
                  {isAr ? group.nameAr : group.nameEn}
                </p>
                <span className="text-3xs text-zinc-600 font-normal">
                  {group.maxSelect === 1
                    ? (isAr ? 'اختر واحداً' : 'Choose 1')
                    : (isAr ? `حتى ${group.maxSelect}` : `Up to ${group.maxSelect}`)}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {group.modifiers.map((mod) => {
                  const isModSelected = selectedModifiers.some((m) => m.id === mod.id);
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => handleToggleModifier(mod, group)}
                      className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition-all ${
                        isModSelected
                          ? 'border-amber-500 bg-amber-500/10 text-white'
                          : 'border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-4 w-4 rounded-md border-2 flex items-center justify-center shrink-0 ${isModSelected ? 'border-amber-500 bg-amber-500' : 'border-zinc-600'}`}>
                          {isModSelected && <Check className="h-2.5 w-2.5 text-black" strokeWidth={3} />}
                        </div>
                        <span>{isAr ? mod.nameAr : mod.nameEn}</span>
                      </div>
                      {mod.priceDelta > 0 && (
                        <span className="font-mono text-xs font-bold text-amber-400">
                          +{(mod.priceDelta / 100).toFixed(2)} {currencySymbol}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── Sticky Footer: Quantity + Add ── */}
        <div className="shrink-0 border-t border-white/10 bg-zinc-900 px-5 py-4 space-y-3">
          {/* Quantity row */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-300">
              {isAr ? 'الكمية' : 'Quantity'}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="h-9 w-9 rounded-xl border border-white/15 bg-white/5 flex items-center justify-center text-white hover:bg-white/15 transition-colors"
              >
                <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
              <span className="w-10 text-center font-mono text-lg font-bold text-white">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="h-9 w-9 rounded-xl border border-white/15 bg-white/5 flex items-center justify-center text-white hover:bg-white/15 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Add to cart button */}
          <button
            type="button"
            onClick={() => onAdd(selectedSizeId, selectedModifiers, quantity)}
            disabled={!selectedSize}
            className="w-full flex items-center justify-between rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 px-5 py-3.5 text-white shadow-lg hover:opacity-95 transition-opacity disabled:opacity-50"
          >
            <div className="flex items-center gap-2.5">
              <ShoppingCart className="h-5 w-5" />
              <span className="text-sm font-bold">
                {isAr ? 'أضف للسلة' : 'Add to Cart'}
              </span>
            </div>
            <span className="font-mono text-sm font-extrabold">
              {(totalMinor / 100).toFixed(2)}
              <span className="text-xs font-normal opacity-80 ms-1">{currencySymbol}</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Menu Client ─────────────────────────────────────────────────────────

export function MenuClient({ categories, products, currencySymbol }: MenuClientProps) {
  const { locale, addItem, itemCount, subtotalMinor } = useCart();
  const isAr = locale === 'ar';

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeProduct, setActiveProduct] = useState<ProductItem | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchCat = selectedCategoryId === 'ALL' || prod.categoryId === selectedCategoryId;
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        prod.nameAr.toLowerCase().includes(term) ||
        prod.nameEn.toLowerCase().includes(term) ||
        (prod.description && prod.description.toLowerCase().includes(term));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategoryId, searchTerm]);

  const handleOpenProduct = useCallback((prod: ProductItem) => {
    setActiveProduct(prod);
  }, []);

  const handleCloseModal = useCallback(() => {
    setActiveProduct(null);
  }, []);

  const handleAddToCart = useCallback((sizeId: string, modifiers: ModifierItem[], qty: number) => {
    if (!activeProduct) return;
    const size = activeProduct.sizes.find((s) => s.id === sizeId) ?? activeProduct.sizes[0];
    if (!size) return;
    addItem({
      productId: activeProduct.id,
      sizeId: size.id,
      nameAr: activeProduct.nameAr,
      nameEn: activeProduct.nameEn,
      sizeNameAr: size.nameAr,
      sizeNameEn: size.nameEn,
      priceMinor: size.price,
      quantity: qty,
      modifiers: modifiers.map((m) => ({
        id: m.id,
        nameAr: m.nameAr,
        nameEn: m.nameEn,
        priceDeltaMinor: m.priceDelta,
      })),
      imageUrl: activeProduct.imageUrl,
    });
    handleCloseModal();
  }, [activeProduct, addItem, handleCloseModal]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12 space-y-8">

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          {isAr ? 'قائمة المشروبات والحلويات' : 'Cafe & Drinks Menu'}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          {isAr
            ? 'تصفح أرقى أنواع القهوة المختصة والمشروبات والحلويات واطلبها مباشرة'
            : 'Explore our specialty coffees, handcrafted drinks, and artisanal desserts'}
        </p>
      </div>

      {/* Search Bar */}
      <div className="mx-auto max-w-md">
        <div className="relative flex items-center rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 shadow-md backdrop-blur-md">
          <Search className="h-4 w-4 text-zinc-400 shrink-0" strokeWidth={1.75} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isAr ? 'ابحث عن قهوة، لاتيه، موخيتو، أو حلوى...' : 'Search coffee, latte, mojito, dessert...'}
            className="w-full bg-transparent px-3 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-hidden"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-xs text-zinc-400 hover:text-white transition-colors">
              {isAr ? 'مسح' : 'Clear'}
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-start sm:justify-center">
        <button
          onClick={() => setSelectedCategoryId('ALL')}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
            selectedCategoryId === 'ALL'
              ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md'
              : 'border border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:text-white'
          }`}
        >
          {isAr ? 'كافة الأصناف' : 'All Categories'}
        </button>
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md'
                  : 'border border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:text-white'
              }`}
            >
              {isAr ? cat.nameAr : cat.nameEn}
            </button>
          );
        })}
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-12 text-center text-zinc-400">
          <ShoppingBag className="mx-auto h-10 w-10 text-zinc-600 mb-3" strokeWidth={1.5} />
          <p className="text-sm font-medium text-white">
            {isAr ? 'لم يتم العثور على أطباق مطابقة' : 'No matching dishes found'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((prod) => {
            const minPrice = prod.sizes[0]?.price ?? 0;
            return (
              <div
                key={prod.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/70 transition-all duration-300 hover:border-white/25 hover:shadow-xl hover:-translate-y-1"
              >
                {/* Clickable Image */}
                <button
                  type="button"
                  onClick={() => handleOpenProduct(prod)}
                  className="relative h-52 w-full overflow-hidden bg-zinc-800 block text-start"
                  aria-label={isAr ? prod.nameAr : prod.nameEn}
                >
                  {prod.imageUrl ? (
                    <Image
                      src={prod.imageUrl}
                      alt={isAr ? prod.nameAr : prod.nameEn}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-zinc-600">
                      <ShoppingBag className="h-8 w-8" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />

                  {/* Category badge */}
                  <span className="absolute top-3 start-3 rounded-md border border-white/10 bg-zinc-950/80 px-2.5 py-1 text-3xs font-semibold text-zinc-300 backdrop-blur-md">
                    {isAr ? prod.category.nameAr : prod.category.nameEn}
                  </span>

                  {/* Featured badge */}
                  {prod.isFeatured && (
                    <span className="absolute top-3 end-3 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 px-2 py-0.5 text-3xs font-bold text-white shadow-sm">
                      {isAr ? 'الأكثر طلباً' : 'Best Seller'}
                    </span>
                  )}

                  {/* Price tag */}
                  <div className="absolute bottom-3 end-3 rounded-lg bg-zinc-950/90 border border-white/10 px-2.5 py-1 text-white shadow-xs font-mono">
                    <span className="text-xs font-bold">{(minPrice / 100).toFixed(2)}</span>{' '}
                    <span className="text-3xs text-zinc-400">{currencySymbol}</span>
                  </div>

                  {/* Hover overlay hint */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="rounded-xl bg-black/50 border border-white/20 px-4 py-2 text-xs font-bold text-white backdrop-blur-sm">
                      {isAr ? 'انقر لعرض التفاصيل' : 'Tap to view details'}
                    </div>
                  </div>
                </button>

                {/* Body — also clickable */}
                <button
                  type="button"
                  onClick={() => handleOpenProduct(prod)}
                  className="p-5 pb-3 space-y-1.5 text-start w-full hover:bg-white/3 transition-colors"
                >
                  <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                    {isAr ? prod.nameAr : prod.nameEn}
                  </h3>
                  <p className="line-clamp-2 text-xs leading-relaxed text-zinc-400">
                    {prod.description || (isAr ? 'محضر طازجاً من أجود المكونات' : 'Freshly prepared with premium ingredients')}
                  </p>
                </button>

                {/* Footer */}
                <div className="border-t border-white/10 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-amber-400">
                    <Star className="h-3.5 w-3.5 fill-amber-400" />
                    <span className="font-mono font-bold text-zinc-200">4.9</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenProduct(prod)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>{isAr ? 'اطلب الآن' : 'Order Now'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Cart Bar */}
      {itemCount > 0 && (
        <div className="sticky bottom-4 z-30 mx-auto max-w-lg">
          <Link
            href="/cart"
            className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 px-5 py-3.5 text-white shadow-2xl backdrop-blur-md transition-transform hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold">
                  {itemCount} {isAr ? 'أصناف مختارة' : 'Items Selected'}
                </div>
                <div className="text-2xs text-white/80 font-mono">
                  {(subtotalMinor / 100).toFixed(2)} {currencySymbol}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold">
              <span>{isAr ? 'عرض السلة' : 'View Cart'}</span>
              {isAr ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
            </div>
          </Link>
        </div>
      )}

      {/* Product Detail Modal */}
      {activeProduct && (
        <ProductModal
          product={activeProduct}
          currencySymbol={currencySymbol}
          isAr={isAr}
          onClose={handleCloseModal}
          onAdd={handleAddToCart}
        />
      )}
    </div>
  );
}
