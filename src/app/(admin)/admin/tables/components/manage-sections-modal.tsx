'use client';

import React from 'react';
import { X, Layers, Edit2, Trash2 } from 'lucide-react';
import { TableItemView } from '../../../../../application/tables/use-cases/list-tables.use-case';
import { SectionItem } from './edit-table-modal';

interface ManageSectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: SectionItem[];
  tables: TableItemView[];
  editingSection: SectionItem | null;
  setEditingSection: (sec: SectionItem | null) => void;
  sectionNameAr: string;
  setSectionNameAr: (val: string) => void;
  sectionNameEn: string;
  setSectionNameEn: (val: string) => void;
  sectionSortOrder: number;
  setSectionSortOrder: (val: number) => void;
  isPending: boolean;
  onSaveSection: (e: React.FormEvent) => void;
  onDeleteSection: (sectionId: string) => void;
}

export function ManageSectionsModal({
  isOpen,
  onClose,
  sections,
  tables,
  editingSection,
  setEditingSection,
  sectionNameAr,
  setSectionNameAr,
  sectionNameEn,
  setSectionNameEn,
  sectionSortOrder,
  setSectionSortOrder,
  isPending,
  onSaveSection,
  onDeleteSection,
}: ManageSectionsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-zinc-700" strokeWidth={1.8} />
            <h3 className="text-base font-bold text-zinc-900">أقسام وقاعات الصالة</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Existing Sections List */}
        <div className="mt-4 space-y-2 max-h-56 overflow-y-auto">
          <p className="text-[11px] font-semibold text-zinc-500">الأقسام الحالية بهذا الفرع:</p>
          {sections.length === 0 ? (
            <p className="text-xs text-zinc-400 py-3 text-center border rounded-xl border-dashed">
              لا توجد أقسام معرفة حتى الآن. أضف قسماً أدناه (مثال: الصالة الرئيسية، العائلات).
            </p>
          ) : (
            sections.map((sec) => {
              const tableCount = tables.filter((t) => t.sectionId === sec.id).length;
              return (
                <div
                  key={sec.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/60 p-2.5 text-xs"
                >
                  <div>
                    <span className="font-bold text-zinc-900">{sec.nameAr}</span>
                    <span className="mr-2 font-mono text-[11px] text-zinc-500">
                      ({sec.nameEn})
                    </span>
                    <span className="mr-3 rounded-md bg-zinc-200/70 px-1.5 py-0.5 text-[10px] text-zinc-700">
                      {tableCount} طاولات
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSection(sec);
                        setSectionNameAr(sec.nameAr);
                        setSectionNameEn(sec.nameEn);
                        setSectionSortOrder(sec.sortOrder);
                      }}
                      className="grid size-6 place-items-center rounded-md text-zinc-600 hover:bg-zinc-200"
                      title="تعديل القسم"
                    >
                      <Edit2 className="size-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteSection(sec.id)}
                      disabled={tableCount > 0}
                      title={
                        tableCount > 0
                          ? 'لا يمكن حذف قسم يحتوي على طاولات'
                          : 'حذف القسم'
                      }
                      className={`grid size-6 place-items-center rounded-md ${
                        tableCount > 0
                          ? 'text-zinc-300 cursor-not-allowed'
                          : 'text-rose-600 hover:bg-rose-50'
                      }`}
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add / Edit Section Form */}
        <form onSubmit={onSaveSection} className="mt-4 pt-4 border-t border-zinc-100 space-y-3 text-xs">
          <p className="font-bold text-zinc-800">
            {editingSection ? `تعديل قسم: ${editingSection.nameAr}` : 'إضافة قسم جديد:'}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">
                الاسم بالعربية <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: الصالة الرئيسية"
                value={sectionNameAr}
                onChange={(e) => setSectionNameAr(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 mb-1">
                الاسم بالإنجليزية <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Main Hall"
                value={sectionNameEn}
                onChange={(e) => setSectionNameEn(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 font-mono text-left"
                dir="ltr"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="w-1/3">
              <label className="block font-semibold text-zinc-700 mb-1">ترتيب العرض</label>
              <input
                type="number"
                min="0"
                value={sectionSortOrder}
                onChange={(e) => setSectionSortOrder(parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-zinc-200 px-3 py-1.5 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>

            <div className="flex items-center gap-2 self-end">
              {editingSection && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingSection(null);
                    setSectionNameAr('');
                    setSectionNameEn('');
                  }}
                  className="rounded-xl border border-zinc-200 px-3 py-2 font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  إلغاء التعديل
                </button>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="rounded-xl bg-zinc-900 px-4 py-2 font-semibold text-white shadow-xs hover:bg-zinc-800 disabled:opacity-50"
              >
                {isPending ? 'جاري الحفظ...' : editingSection ? 'حفظ التعديل' : 'إضافة القسم'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
