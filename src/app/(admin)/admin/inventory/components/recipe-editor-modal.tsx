'use client';

import React, { useState } from 'react';
import { X, Check, Loader2, Plus, Trash2, BookOpen } from 'lucide-react';
import { saveProductRecipesAction } from '../../../../actions/inventory.actions';
import { InventoryItemDto, RecipeItemDto } from '../../../../../domain/inventory/contracts/inventory.repository';
import { CatalogProductForRecipe } from '../inventory.types';

interface RecipeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: CatalogProductForRecipe;
  existingRecipes: RecipeItemDto[];
  inventoryItems: InventoryItemDto[];
}

interface EditableRecipeLine {
  id: string; // temporary key
  inventoryItemId: string;
  scopeType: 'PRODUCT' | 'SIZE' | 'MODIFIER';
  productSizeId?: string;
  modifierId?: string;
  quantity: number;
}

export function RecipeEditorModal({
  isOpen,
  onClose,
  onSuccess,
  product,
  existingRecipes,
  inventoryItems,
}: RecipeEditorModalProps) {
  const [lines, setLines] = useState<EditableRecipeLine[]>(() => {
    if (existingRecipes.length === 0) return [];
    return existingRecipes.map((r) => ({
      id: r.id,
      inventoryItemId: r.inventoryItemId,
      scopeType: r.productSizeId ? 'SIZE' : r.modifierId ? 'MODIFIER' : 'PRODUCT',
      productSizeId: r.productSizeId ?? undefined,
      modifierId: r.modifierId ?? undefined,
      quantity: r.quantity,
    }));
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddLine = () => {
    if (inventoryItems.length === 0) return;
    setLines((prev) => [
      ...prev,
      {
        id: 'tmp-' + Math.random().toString(),
        inventoryItemId: inventoryItems[0].id,
        scopeType: 'PRODUCT',
        quantity: 0.1,
      },
    ]);
  };

  const handleRemoveLine = (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const handleUpdateLine = (id: string, updates: Partial<EditableRecipeLine>) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const next = { ...l, ...updates };
        if (updates.scopeType === 'PRODUCT') {
          next.productSizeId = undefined;
          next.modifierId = undefined;
        } else if (updates.scopeType === 'SIZE' && !next.productSizeId && product.sizes[0]) {
          next.productSizeId = product.sizes[0].id;
          next.modifierId = undefined;
        } else if (updates.scopeType === 'MODIFIER' && !next.modifierId && product.modifiers[0]) {
          next.modifierId = product.modifiers[0].id;
          next.productSizeId = undefined;
        }
        return next;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const items = lines.map((l) => ({
      inventoryItemId: l.inventoryItemId,
      productSizeId: l.scopeType === 'SIZE' ? l.productSizeId ?? null : null,
      modifierId: l.scopeType === 'MODIFIER' ? l.modifierId ?? null : null,
      quantity: Number(l.quantity),
    }));

    const res = await saveProductRecipesAction({
      productId: product.id,
      items,
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error || 'حدث خطأ أثناء حفظ الوصفة');
      return;
    }

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4" dir="rtl">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border border-zinc-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 p-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-zinc-700" strokeWidth={1.75} />
            <div>
              <h3 className="font-semibold text-zinc-900 text-base">
                وصفة ومكونات: {product.nameAr}
              </h3>
              <p className="text-xs text-zinc-500 font-mono">
                {product.nameEn} • {product.categoryNameAr}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs text-zinc-600 space-y-1">
            <p className="font-semibold text-zinc-800">ملاحظة تشغيلية (الوصفات اختيارية):</p>
            <p>
              إذا لم تقم بإضافة مكونات، سيعمل الصنف بنظام التشغيل المباشر دون خصم تلقائي من الوصفات.
              يمكنك ربط المكونات بالصنف ككل، أو تخصيص مكونات لكل مقاس أو إضافة بشكل مستقل.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-800">بنود الوصفة واستهلاك المواد الخام</span>
              <button
                type="button"
                onClick={handleAddLine}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-md border border-zinc-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة مكون للطبق</span>
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-zinc-200 rounded-lg text-zinc-500 text-xs">
                لا توجد مكونات مربوطة حالياً. الصنف يعمل بالتشغيل المباشر.
              </div>
            ) : (
              <div className="space-y-2">
                {lines.map((line) => {
                  const selectedInv = inventoryItems.find((i) => i.id === line.inventoryItemId);
                  return (
                    <div
                      key={line.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2.5 rounded-lg border border-zinc-200 bg-zinc-50/50"
                    >
                      {/* Component Item */}
                      <div className="flex-1 w-full sm:w-auto">
                        <select
                          value={line.inventoryItemId}
                          onChange={(e) => handleUpdateLine(line.id, { inventoryItemId: e.target.value })}
                          className="w-full text-xs border border-zinc-300 rounded-md px-2 py-1.5 bg-white text-zinc-900"
                        >
                          {inventoryItems.map((inv) => (
                            <option key={inv.id} value={inv.id}>
                              {inv.nameAr} ({inv.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Scope Type */}
                      <div className="w-full sm:w-32">
                        <select
                          value={line.scopeType}
                          onChange={(e) =>
                            handleUpdateLine(line.id, {
                              scopeType: e.target.value as 'PRODUCT' | 'SIZE' | 'MODIFIER',
                            })
                          }
                          className="w-full text-xs border border-zinc-300 rounded-md px-2 py-1.5 bg-white text-zinc-900"
                        >
                          <option value="PRODUCT">الصنف ككل</option>
                          {product.sizes.length > 0 && <option value="SIZE">لمقاس محدد</option>}
                          {product.modifiers.length > 0 && <option value="MODIFIER">لإضافة محددة</option>}
                        </select>
                      </div>

                      {/* Specific size/modifier selector */}
                      {line.scopeType === 'SIZE' && (
                        <div className="w-full sm:w-32">
                          <select
                            value={line.productSizeId ?? ''}
                            onChange={(e) => handleUpdateLine(line.id, { productSizeId: e.target.value })}
                            className="w-full text-xs border border-zinc-300 rounded-md px-2 py-1.5 bg-white text-zinc-900"
                          >
                            {product.sizes.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.nameAr}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {line.scopeType === 'MODIFIER' && (
                        <div className="w-full sm:w-36">
                          <select
                            value={line.modifierId ?? ''}
                            onChange={(e) => handleUpdateLine(line.id, { modifierId: e.target.value })}
                            className="w-full text-xs border border-zinc-300 rounded-md px-2 py-1.5 bg-white text-zinc-900"
                          >
                            {product.modifiers.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.nameAr} ({m.groupNameAr})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Quantity */}
                      <div className="w-full sm:w-28 flex items-center gap-1">
                        <input
                          type="number"
                          step="0.001"
                          min="0.001"
                          required
                          value={line.quantity || ''}
                          onChange={(e) => handleUpdateLine(line.id, { quantity: Number(e.target.value) })}
                          placeholder="الكمية"
                          className="w-full text-xs font-mono border border-zinc-300 rounded-md px-2 py-1.5 bg-white text-zinc-900"
                        />
                        <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                          {selectedInv?.unit ?? ''}
                        </span>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(line.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md self-end sm:self-auto"
                        title="حذف البند"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>حفظ الوصفة</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
