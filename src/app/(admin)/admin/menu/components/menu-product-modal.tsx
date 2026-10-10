'use client';

import React, { useState } from 'react';
import { CirclePlus, X, Check } from 'lucide-react';
import { ProductImagePicker } from '../product-image-picker';
import { Category, Group, Product, DraftSize } from './menu-types';

const inputClass =
  'min-h-12 w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10';
const labelClass = 'block space-y-1.5 text-sm font-medium text-zinc-700';

function toMajor(value: number) {
  return (value / 100).toFixed(2);
}

function Field({
  label,
  name,
  defaultValue,
  value,
  onChange,
  type = 'text',
  required = true,
  ...props
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  value?: string;
  onChange?: (value: string) => void;
  type?: string;
  required?: boolean;
  min?: string | number;
  max?: string | number;
  step?: string;
  inputMode?: 'decimal' | 'numeric';
}) {
  return (
    <label className={labelClass}>
      {label}
      <input
        className={inputClass}
        name={name}
        type={type}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        required={required}
        {...props}
      />
    </label>
  );
}

function changeSize(
  index: number,
  key: keyof DraftSize,
  value: string,
  setter: React.Dispatch<React.SetStateAction<DraftSize[]>>
) {
  setter((items) =>
    items.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item))
  );
}

interface MenuProductModalProps {
  product?: Product;
  categories: Category[];
  groups: Group[];
  onSave: (data: FormData) => Promise<void>;
  onCancel: () => void;
  pending: boolean;
}

export function MenuProductModal({
  product,
  categories,
  groups,
  onSave,
  onCancel,
  pending,
}: MenuProductModalProps) {
  const defaultSizes = product?.sizes.map((size) => ({
    nameAr: size.nameAr,
    nameEn: size.nameEn,
    price: toMajor(size.price),
  })) ?? [{ nameAr: 'عادي', nameEn: 'Regular', price: '' }];

  const [sizes, setSizes] = useState<DraftSize[]>(defaultSizes);

  return (
    <form action={onSave} className="space-y-4">
      <label className={labelClass}>
        التصنيف
        <select
          name="categoryId"
          defaultValue={product?.categoryId ?? categories[0]?.id ?? ''}
          required
          className={inputClass}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.nameAr}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="اسم الصنف بالعربية" name="nameAr" defaultValue={product?.nameAr} />
        <Field label="اسم الصنف بالإنجليزية" name="nameEn" defaultValue={product?.nameEn} />
      </div>

      <ProductImagePicker initialUrl={product?.imageUrl} name="imageUrl" />

      <label className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 cursor-pointer">
        <input
          type="checkbox"
          name="isFeatured"
          defaultChecked={product?.isFeatured ?? false}
          className="size-4 accent-amber-600 rounded"
        />
        <div>
          <span className="text-sm font-semibold text-zinc-900 block">
            عرض في السلايدر الرئيسي للموقع (طبق مميز / عروض)
          </span>
          <span className="text-xs text-zinc-500 block">
            سيتم عرض هذا الصنف في السلايدر المتحرك في أعلى الصفحة الرئيسية
          </span>
        </div>
      </label>

      <label className={labelClass}>
        الوصف
        <textarea
          name="description"
          defaultValue={product?.description ?? ''}
          rows={2}
          className={`${inputClass} py-3`}
        />
      </label>

      <div className="space-y-3 rounded-2xl bg-zinc-50 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-800">المقاسات والأسعار</h3>
          <button
            type="button"
            onClick={() => setSizes((items) => [...items, { nameAr: '', nameEn: '', price: '' }])}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <CirclePlus size={15} />
            إضافة مقاس
          </button>
        </div>
        {sizes.map((size, index) => (
          <div
            key={index}
            className="grid grid-cols-1 gap-2 rounded-xl border border-zinc-200 bg-white p-3 sm:grid-cols-[1fr_1fr_0.8fr_auto] sm:items-end"
          >
            <Field
              label="الاسم العربي"
              name="sizeNameAr"
              value={size.nameAr}
              onChange={(value) => changeSize(index, 'nameAr', value, setSizes)}
            />
            <Field
              label="الاسم الإنجليزي"
              name="sizeNameEn"
              value={size.nameEn}
              onChange={(value) => changeSize(index, 'nameEn', value, setSizes)}
            />
            <Field
              label="السعر"
              name="sizePrice"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={size.price}
              onChange={(value) => changeSize(index, 'price', value, setSizes)}
            />
            {sizes.length > 1 && (
              <button
                type="button"
                aria-label="حذف المقاس"
                onClick={() => setSizes((items) => items.filter((_, itemIndex) => itemIndex !== index))}
                className="grid size-11 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      {groups.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-semibold text-zinc-800">مجموعات الإضافات</legend>
          {groups.map((group) => (
            <label
              key={group.id}
              className="flex min-h-12 items-center gap-3 rounded-xl border border-zinc-200 px-3 cursor-pointer hover:bg-zinc-50"
            >
              <input
                type="checkbox"
                name="modifierGroupIds"
                value={group.id}
                defaultChecked={product?.modifierGroups.some((item) => item.group.id === group.id)}
                className="size-4 accent-zinc-900"
              />
              <span className="text-sm text-zinc-700">{group.nameAr}</span>
            </label>
          ))}
        </fieldset>
      )}

      <div className="flex items-center gap-2.5 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="min-h-12 rounded-xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition disabled:opacity-50"
        >
          إلغاء
        </button>
        <button
          disabled={pending}
          type="submit"
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white disabled:opacity-60 hover:bg-zinc-800 transition"
        >
          {pending ? 'جارٍ الحفظ...' : <><Check size={17} />حفظ التغييرات</>}
        </button>
      </div>
    </form>
  );
}
