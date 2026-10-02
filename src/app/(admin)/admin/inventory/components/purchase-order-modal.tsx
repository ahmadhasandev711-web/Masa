'use client';

import React, { useState } from 'react';
import { X, Check, Loader2, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { createPurchaseOrderAction } from '../../../../actions/inventory.actions';
import { SupplierDto, InventoryItemDto } from '../../../../../domain/inventory/contracts/inventory.repository';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  branchId: string;
  suppliers: SupplierDto[];
  inventoryItems: InventoryItemDto[];
  currencySymbol: string;
}

interface OrderItemRow {
  id: string;
  inventoryItemId: string;
  quantity: number;
  unitCostDecimal: number;
}

export function PurchaseOrderModal({
  isOpen,
  onClose,
  onSuccess,
  branchId,
  suppliers,
  inventoryItems,
  currencySymbol,
}: PurchaseOrderModalProps) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? '');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OrderItemRow[]>(() => {
    if (inventoryItems.length === 0) return [];
    return [
      {
        id: 'row-1',
        inventoryItemId: inventoryItems[0].id,
        quantity: 10,
        unitCostDecimal: inventoryItems[0].defaultCostMinor / 100,
      },
    ];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddItem = () => {
    if (inventoryItems.length === 0) return;
    setItems((prev) => [
      ...prev,
      {
        id: 'row-' + Math.random().toString(),
        inventoryItemId: inventoryItems[0].id,
        quantity: 1,
        unitCostDecimal: inventoryItems[0].defaultCostMinor / 100,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleItemChange = (id: string, updates: Partial<OrderItemRow>) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const next = { ...i, ...updates };
        if (updates.inventoryItemId) {
          const inv = inventoryItems.find((item) => item.id === updates.inventoryItemId);
          if (inv) next.unitCostDecimal = inv.defaultCostMinor / 100;
        }
        return next;
      })
    );
  };

  const totalCalculated = items.reduce(
    (sum, item) => sum + item.quantity * item.unitCostDecimal,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      setError('يرجى اختيار المورد');
      return;
    }
    if (items.length === 0) {
      setError('يرجى إضافة صنف واحد على الأقل في أمر الشراء');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await createPurchaseOrderAction({
      supplierId,
      branchId,
      invoiceNumber: invoiceNumber.trim() || null,
      notes: notes.trim() || null,
      items: items.map((i) => ({
        inventoryItemId: i.inventoryItemId,
        quantity: Number(i.quantity),
        unitCostDecimal: Number(i.unitCostDecimal),
      })),
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error || 'حدث خطأ أثناء إنشاء أمر الشراء');
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
            <ShoppingCart className="w-5 h-5 text-zinc-700" strokeWidth={1.75} />
            <h3 className="font-semibold text-zinc-900 text-base">إنشاء أمر شراء وتوريد جديد</h3>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">المورد *</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full text-sm border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:outline-hidden focus:border-zinc-800 bg-white"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">رقم فاتورة المورد (اختياري)</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-98765"
                className="w-full text-sm border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:outline-hidden focus:border-zinc-800 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">ملاحظات التوريد</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: توريد دفعة اللحوم الأسبوعية"
              className="w-full text-sm border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:outline-hidden focus:border-zinc-800"
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-800">الأصناف الموردة</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-md border border-zinc-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة صنف للفاتورة</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((row) => {
                const inv = inventoryItems.find((i) => i.id === row.inventoryItemId);
                const subtotal = row.quantity * row.unitCostDecimal;

                return (
                  <div
                    key={row.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2.5 rounded-lg border border-zinc-200 bg-zinc-50/50"
                  >
                    <div className="flex-1 w-full sm:w-auto">
                      <select
                        value={row.inventoryItemId}
                        onChange={(e) => handleItemChange(row.id, { inventoryItemId: e.target.value })}
                        className="w-full text-xs border border-zinc-300 rounded-md px-2 py-1.5 bg-white text-zinc-900"
                      >
                        {inventoryItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.nameAr} ({item.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full sm:w-28 flex items-center gap-1">
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        required
                        value={row.quantity || ''}
                        onChange={(e) => handleItemChange(row.id, { quantity: Number(e.target.value) })}
                        placeholder="الكمية"
                        className="w-full text-xs font-mono border border-zinc-300 rounded-md px-2 py-1.5 bg-white text-zinc-900"
                      />
                      <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                        {inv?.unit ?? ''}
                      </span>
                    </div>

                    <div className="w-full sm:w-32 flex items-center gap-1">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={row.unitCostDecimal || ''}
                        onChange={(e) => handleItemChange(row.id, { unitCostDecimal: Number(e.target.value) })}
                        placeholder="السعر"
                        className="w-full text-xs font-mono border border-zinc-300 rounded-md px-2 py-1.5 bg-white text-zinc-900"
                      />
                      <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                        {currencySymbol}
                      </span>
                    </div>

                    <div className="w-24 text-left font-mono text-xs font-semibold text-zinc-800 self-center">
                      {subtotal.toFixed(2)} {currencySymbol}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(row.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md self-end sm:self-auto"
                      title="حذف البند"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center bg-zinc-100 p-3 rounded-lg border border-zinc-200 text-sm font-semibold text-zinc-900">
              <span>إجمالي أمر الشراء:</span>
              <span className="font-mono text-base">
                {totalCalculated.toFixed(2)} {currencySymbol}
              </span>
            </div>
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
              <span>حفظ كأمر شراء مسودة</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
