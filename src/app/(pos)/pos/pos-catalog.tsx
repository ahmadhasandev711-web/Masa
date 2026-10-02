'use client';

import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { PosCategory, PosProduct } from '../../../domain/pos/contracts/pos.repository';
import { Money } from '../../../domain/shared/value-objects/money';
import { posButton, posInput } from './pos-ui';

export function PosCatalog({ categories, currency, locale, disabled, onSelect }: {
  categories: PosCategory[]; currency: string; locale: string; disabled: boolean; onSelect: (product: PosProduct) => void;
}) {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const products = categories.filter((category) => !categoryId || category.id === categoryId).flatMap((category) => category.products)
    .filter((product) => (product.nameAr + product.nameEn).toLowerCase().includes(search.trim().toLowerCase()));
  return (
    <section className="min-w-0 p-3 sm:p-4">
      <label className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 h-10 shadow-2xs">
        <Search size={16} strokeWidth={1.75} className="text-zinc-400" />
        <input
          aria-label="البحث عن صنف"
          placeholder="ابحث عن صنف بالاسم..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={posInput + ' border-0 focus:ring-0 text-xs h-9 min-h-0'}
        />
      </label>
      <div className="my-2.5 flex gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          aria-pressed={!categoryId}
          onClick={() => setCategoryId(null)}
          className={
            posButton +
            ' py-1.5 px-3 min-h-0 text-xs' +
            (!categoryId ? ' bg-zinc-900 text-white hover:bg-zinc-800' : '')
          }
        >
          الكل
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            aria-pressed={categoryId === category.id}
            onClick={() => setCategoryId(category.id)}
            className={
              posButton +
              ' shrink-0 py-1.5 px-3 min-h-0 text-xs' +
              (categoryId === category.id ? ' bg-zinc-900 text-white hover:bg-zinc-800' : '')
            }
          >
            {category.nameAr}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5">
        {products.map((product) => (
          <button
            key={product.id}
            disabled={disabled}
            onClick={() => onSelect(product)}
            className="flex h-24 sm:h-26 flex-col justify-between rounded-xl border border-zinc-200 bg-white p-3 text-start shadow-2xs transition hover:border-zinc-400 hover:shadow-xs active:scale-[0.98] disabled:opacity-50"
          >
            <strong className="text-xs sm:text-sm font-bold text-zinc-900 leading-snug line-clamp-2">
              {product.nameAr}
            </strong>
            <div className="flex w-full items-center justify-between gap-1 mt-auto pt-1">
              <span className="text-[11px] font-semibold text-zinc-600 font-mono">
                من {Money.fromMinor(Math.min(...product.sizes.map((size) => size.price)), currency).format(locale)}
              </span>
              <span className="grid size-6 place-items-center rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition">
                <Plus size={14} />
              </span>
            </div>
          </button>
        ))}
      </div>
      {!products.length && (
        <p className="py-20 text-center text-sm text-zinc-500">لا توجد أصناف متاحة مطابقة للبحث.</p>
      )}
    </section>
  );
}
